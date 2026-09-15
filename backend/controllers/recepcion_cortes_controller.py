from datetime import date
from flask import jsonify, request, current_app
from db.connection import get_connection


def asegurar_esquema(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS recepcion_cortes (
        id_recepcion INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL, controlador VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS recepcion_cortes_linea (
        id_linea INT AUTO_INCREMENT PRIMARY KEY,
        recepcion_id INT NOT NULL, orden_id INT NULL,
        numero_orden VARCHAR(100) NOT NULL, articulo VARCHAR(100) NOT NULL,
        producto VARCHAR(255) NOT NULL, color VARCHAR(100) NOT NULL,
        remito VARCHAR(100) NOT NULL, cantidad INT NOT NULL,
        estado VARCHAR(20) NOT NULL, observaciones VARCHAR(500) NOT NULL,
        FOREIGN KEY (recepcion_id) REFERENCES recepcion_cortes(id_recepcion) ON DELETE CASCADE,
        FOREIGN KEY (orden_id) REFERENCES orden_fabricacion(id_orden) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")


def validar(data):
    if not isinstance(data, dict):
        raise ValueError("Datos de recepción inválidos.")
    fecha = date.fromisoformat(str(data.get("fecha", ""))).isoformat()
    controlador = str(data.get("controlador") or "").strip()
    if not controlador or len(controlador) > 100:
        raise ValueError("Ingresá el nombre del controlador (hasta 100 caracteres).")
    lineas = data.get("lineas")
    if not isinstance(lineas, list) or not 1 <= len(lineas) <= 200:
        raise ValueError("Cargá entre 1 y 200 órdenes por recepción.")
    resultado = []
    for linea in lineas:
        if not isinstance(linea, dict):
            raise ValueError("Fila inválida.")
        orden = str(linea.get("orden_id", ""))
        cantidad = str(linea.get("cantidad", ""))
        if not orden.isdecimal() or int(orden) <= 0 or not cantidad.isdecimal() or not 1 <= int(cantidad) <= 2147483647:
            raise ValueError("Seleccioná una orden y una cantidad entera de pares mayor a cero.")
        remito = str(linea.get("remito") or "").strip()
        estado = linea.get("estado")
        observaciones = str(linea.get("observaciones") or "").strip()
        if not remito or len(remito) > 100:
            raise ValueError("Ingresá el remito (hasta 100 caracteres).")
        if estado not in ("Conforme", "No conforme"):
            raise ValueError("Seleccioná Conforme o No conforme.")
        if estado == "No conforme" and (not observaciones or len(observaciones) > 500):
            raise ValueError("Describí la no conformidad (hasta 500 caracteres).")
        resultado.append((int(orden), remito, int(cantidad), estado, observaciones if estado == "No conforme" else ""))
    return fecha, controlador, resultado


def listar():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        asegurar_esquema(cursor)
        cursor.execute("SELECT * FROM recepcion_cortes ORDER BY fecha DESC, id_recepcion DESC")
        recepciones = cursor.fetchall()
        cursor.execute("SELECT * FROM recepcion_cortes_linea ORDER BY id_linea")
        grupos = {}
        for linea in cursor.fetchall():
            grupos.setdefault(linea["recepcion_id"], []).append(linea)
        for recepcion in recepciones:
            recepcion["fecha"] = recepcion["fecha"].isoformat()
            recepcion["lineas"] = grupos.get(recepcion["id_recepcion"], [])
        return jsonify(recepciones)
    finally:
        cursor.close()
        conn.close()


def validar_limites(cursor, lineas, id_recepcion):
    solicitados = {}
    for orden, _, cantidad, _, _ in lineas:
        solicitados[orden] = solicitados.get(orden, 0) + cantidad
    # Lock all affected orders in a stable order. Concurrent receptions must
    # finish before reading the received quantities (current, locking reads).
    ids = sorted(solicitados)
    marcadores = ",".join(["%s"] * len(ids))
    cursor.execute(f"SELECT id_orden FROM orden_fabricacion WHERE id_orden IN ({marcadores}) ORDER BY id_orden FOR UPDATE", tuple(ids))
    cursor.fetchall()
    for orden in ids:
        cursor.execute("SELECT cantidad_pares FROM detalle_orden WHERE orden_fabricacion_id_orden=%s FOR UPDATE", (orden,))
        total = sum(int(fila["cantidad_pares"]) for fila in cursor.fetchall())
        cursor.execute("SELECT cantidad FROM recepcion_cortes_linea WHERE orden_id=%s AND recepcion_id<>%s FOR UPDATE", (orden, id_recepcion or 0))
        recibido = sum(int(fila["cantidad"]) for fila in cursor.fetchall())
        disponible = max(0, total - recibido)
        if solicitados[orden] > disponible:
            raise ValueError(f"La orden tiene {total} pares de corte y {recibido} ya recibidos en otras tandas. Podés cargar como máximo {disponible} pares en esta recepción (sumando todas sus filas).")


def guardar(id_recepcion=None):
    try:
        fecha, controlador, lineas = validar(request.get_json(silent=True))
    except (ValueError, TypeError):
        return jsonify({"error": "Revisá fecha, controlador, órdenes, remitos y pares. Las no conformidades requieren observaciones (hasta 500 caracteres)."}), 400
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        asegurar_esquema(cursor)
        if id_recepcion is not None:
            cursor.execute("SELECT id_recepcion FROM recepcion_cortes WHERE id_recepcion=%s FOR UPDATE", (id_recepcion,))
            if not cursor.fetchone():
                return jsonify({"error": "Recepción no encontrada."}), 404
        validar_limites(cursor, lineas, id_recepcion)
        # All lines are validated before the batch is written; failures roll back the whole reception.
        datos = []
        for orden, remito, cantidad, estado, observaciones in lineas:
            cursor.execute("""SELECT o.numero_orden, p.articulo_producto AS articulo,
                p.nombre_producto AS producto, COALESCE(c.color, '') AS color
                FROM orden_fabricacion o JOIN producto p ON p.id_producto=o.producto_id_producto
                LEFT JOIN colores c ON c.id_color=p.colores_id_color WHERE o.id_orden=%s""", (orden,))
            registro = cursor.fetchone()
            if not registro:
                conn.rollback()
                return jsonify({"error": "Una de las órdenes ya no existe. Actualizá la lista."}), 400
            datos.append((orden, registro["numero_orden"], registro["articulo"] or "", registro["producto"], registro["color"], remito, cantidad, estado, observaciones))
        if id_recepcion is not None:
            cursor.execute("UPDATE recepcion_cortes SET fecha=%s, controlador=%s WHERE id_recepcion=%s", (fecha, controlador, id_recepcion))
            cursor.execute("DELETE FROM recepcion_cortes_linea WHERE recepcion_id=%s", (id_recepcion,))
        else:
            cursor.execute("INSERT INTO recepcion_cortes (fecha,controlador) VALUES (%s,%s)", (fecha, controlador))
            id_recepcion = cursor.lastrowid
        cursor.executemany("""INSERT INTO recepcion_cortes_linea
            (recepcion_id,orden_id,numero_orden,articulo,producto,color,remito,cantidad,estado,observaciones)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""", [(id_recepcion, *fila) for fila in datos])
        conn.commit()
        return jsonify({"id_recepcion": id_recepcion, "mensaje": "Recepción guardada."}), 200
    except ValueError as error:
        conn.rollback()
        return jsonify({"error": str(error)}), 409
    except Exception:
        conn.rollback()
        current_app.logger.exception("Error guardando R018/1")
        return jsonify({"error": "No se pudo guardar la recepción. No se guardó ninguna fila."}), 500
    finally:
        cursor.close()
        conn.close()
