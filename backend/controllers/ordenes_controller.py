from flask import jsonify, request
from db.connection import get_connection
from utils.db_helpers import responder_lista, responder_uno, responder_accion
from utils.forced_deletes import eliminar_orden as eliminar_orden_forzada, responder_borrado_forzado, responder_borrado_simple


def _normalizar_talles(talles):
    resultado = []
    vistos = set()

    for item in talles or []:
        talle = str(item.get("talle", "")).strip()
        cantidad = int(item.get("cantidad_pares") or 0)

        if not talle or cantidad <= 0 or talle in vistos:
            continue

        vistos.add(talle)
        resultado.append((talle, cantidad))

    return resultado


def _guardar_talles(cursor, id_orden, talles):
    cursor.execute(
        "DELETE FROM detalle_orden WHERE orden_fabricacion_id_orden = %s",
        (id_orden,),
    )

    if talles:
        cursor.executemany(
            """
            INSERT INTO detalle_orden
              (orden_fabricacion_id_orden, talle, cantidad_pares)
            VALUES (%s, %s, %s)
            """,
            [(id_orden, talle, cantidad) for talle, cantidad in talles],
        )


def _normalizar_materiales(materiales):
    resultado = []
    vistos = set()
    for id_lote in materiales or []:
        try:
            id_lote = int(id_lote)
        except (TypeError, ValueError):
            continue
        if id_lote > 0 and id_lote not in vistos:
            vistos.add(id_lote)
            resultado.append(id_lote)
    return resultado


def _guardar_r013(cursor, id_orden, fecha, data):
    """Crea o actualiza la R013 que forma parte de la orden de fabricación."""
    cursor.execute(
        """
        SELECT id_planilla
        FROM planilla_produccion
        WHERE orden_fabricacion_id_orden = %s
          AND (UPPER(numero_planilla) = 'R013' OR tipo_planilla = 'Corte y Aparado')
        ORDER BY id_planilla
        LIMIT 1
        """,
        (id_orden,),
    )
    planilla = cursor.fetchone()

    if planilla:
        id_planilla = planilla["id_planilla"]
        cursor.execute(
            """
            UPDATE planilla_produccion
            SET numero_planilla = 'R013', fecha = %s,
                tipo_planilla = 'Corte y Aparado', maquinas_id_maquina = NULL
            WHERE id_planilla = %s
            """,
            (fecha, id_planilla),
        )
    else:
        cursor.execute(
            """
            INSERT INTO planilla_produccion
              (orden_fabricacion_id_orden, numero_planilla, fecha, tipo_planilla, maquinas_id_maquina, estado)
            VALUES (%s, 'R013', %s, 'Corte y Aparado', NULL, 'Pendiente')
            """,
            (id_orden, fecha),
        )
        id_planilla = cursor.lastrowid

    cursor.execute(
        "DELETE FROM operarios_planilla WHERE planilla_produccion_id_planilla = %s",
        (id_planilla,),
    )
    operarios = [
        ("Corte", str(data.get("operario_corte") or "").strip(), id_planilla),
        ("Aparado", str(data.get("operario_aparado") or "").strip(), id_planilla),
    ]
    operarios = [item for item in operarios if item[1]]
    if operarios:
        cursor.executemany(
            """
            INSERT INTO operarios_planilla (etapa, nombre_operario, planilla_produccion_id_planilla)
            VALUES (%s, %s, %s)
            """,
            operarios,
        )

    cursor.execute(
        "DELETE FROM uso_materiales WHERE planilla_produccion_id_planilla = %s",
        (id_planilla,),
    )
    materiales = _normalizar_materiales(data.get("materiales"))
    if materiales:
        cursor.executemany(
            """
            INSERT INTO uso_materiales
              (lote_materiales_id_lote, planilla_produccion_id_planilla, cantidad_usada)
            VALUES (%s, %s, 0)
            """,
            [(id_lote, id_planilla) for id_lote in materiales],
        )

    return id_planilla


def listar_ordenes():
    return responder_lista("sp_listar_ordenes")


def obtener_orden(id_orden):
    return responder_uno("sp_obtener_orden", (id_orden,))


def crear_orden():
    data = request.json or {}
    talles = _normalizar_talles(data.get("talles"))

    if not talles:
        return jsonify({"error": "Debe cargar al menos un talle con cantidad."}), 400
    if not str(data.get("operario_corte") or "").strip() or not str(data.get("operario_aparado") or "").strip():
        return jsonify({"error": "Debe indicar los operarios de corte y aparado."}), 400
    if not _normalizar_materiales(data.get("materiales")):
        return jsonify({"error": "Debe seleccionar al menos un material utilizado."}), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO orden_fabricacion (producto_id_producto, numero_orden, fecha)
            VALUES (%s, %s, %s)
            """,
            (
                data.get("producto_id_producto"),
                data.get("numero_orden"),
                data.get("fecha"),
            ),
        )
        id_orden = cursor.lastrowid
        _guardar_talles(cursor, id_orden, talles)
        id_planilla = _guardar_r013(cursor, id_orden, data.get("fecha"), data)
        conn.commit()
        return jsonify({"id_orden": id_orden, "id_planilla": id_planilla, "mensaje": "Orden y R013 creadas correctamente"}), 201
    except Exception as error:
        if conn:
            conn.rollback()
        return jsonify({"error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def actualizar_orden(id_orden):
    data = request.json or {}
    talles = _normalizar_talles(data.get("talles"))

    if not talles:
        return jsonify({"error": "Debe cargar al menos un talle con cantidad."}), 400
    if not str(data.get("operario_corte") or "").strip() or not str(data.get("operario_aparado") or "").strip():
        return jsonify({"error": "Debe indicar los operarios de corte y aparado."}), 400
    if not _normalizar_materiales(data.get("materiales")):
        return jsonify({"error": "Debe seleccionar al menos un material utilizado."}), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            UPDATE orden_fabricacion
            SET producto_id_producto = %s, numero_orden = %s, fecha = %s
            WHERE id_orden = %s
            """,
            (
                data.get("producto_id_producto"),
                data.get("numero_orden"),
                data.get("fecha"),
                id_orden,
            ),
        )
        _guardar_talles(cursor, id_orden, talles)
        _guardar_r013(cursor, id_orden, data.get("fecha"), data)
        conn.commit()
        return jsonify({"mensaje": "Orden actualizada correctamente"}), 200
    except Exception as error:
        if conn:
            conn.rollback()
        return jsonify({"error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def listar_talles_orden(id_orden):
    return responder_lista("sp_listar_talles_orden", (id_orden,))


def eliminar_orden(id_orden):
    if request.args.get("forzar") == "1":
        return responder_borrado_forzado(eliminar_orden_forzada, id_orden, "orden")
    return responder_borrado_simple("orden_fabricacion", "id_orden", id_orden, "orden")
