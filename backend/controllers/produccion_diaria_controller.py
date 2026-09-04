from flask import jsonify, request

from db.connection import get_connection
from utils.db_helpers import serializar_filas


def listar_producciones_diarias():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT pdl.id_linea, ofab.numero_orden,
                   prod.articulo_producto AS articulo, prod.nombre_producto AS producto,
                   m.nombre_maquina AS inyectora, pd.fecha,
                   COALESCE(SUM(dpdl.cantidad_pares), 0) AS total_pares
            FROM produccion_diaria pd
            INNER JOIN produccion_diaria_bloque pdb
              ON pdb.produccion_diaria_id = pd.id_produccion_diaria
            INNER JOIN maquinas m ON m.id_maquina = pdb.maquinas_id_maquina
            INNER JOIN produccion_diaria_linea pdl ON pdl.bloque_id = pdb.id_bloque
            INNER JOIN orden_fabricacion ofab ON ofab.id_orden = pdl.orden_fabricacion_id_orden
            INNER JOIN producto prod ON prod.id_producto = ofab.producto_id_producto
            LEFT JOIN detalle_produccion_diaria dpdl ON dpdl.linea_id = pdl.id_linea
            GROUP BY pdl.id_linea, ofab.numero_orden, prod.articulo_producto,
                     prod.nombre_producto, m.nombre_maquina, pd.fecha
            ORDER BY pd.fecha DESC, pd.id_produccion_diaria DESC, pdl.id_linea DESC
            """
        )
        return jsonify(serializar_filas(cursor.fetchall())), 200
    finally:
        cursor.close()
        conn.close()


def listar_disponibilidad_ordenes():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT ofab.id_orden, ofab.numero_orden, prod.nombre_producto AS producto,
                   dor.talle, dor.cantidad_pares AS planificados,
                   COALESCE(SUM(dp.cantidad_pares), 0) AS producidos
            FROM orden_fabricacion ofab
            INNER JOIN producto prod ON prod.id_producto = ofab.producto_id_producto
            INNER JOIN detalle_orden dor ON dor.orden_fabricacion_id_orden = ofab.id_orden
            LEFT JOIN planilla_produccion pp
              ON pp.orden_fabricacion_id_orden = ofab.id_orden
             AND (UPPER(pp.numero_planilla) = 'R013/1' OR pp.tipo_planilla = 'Calzado e Inyección')
            LEFT JOIN detalle_planilla dp ON dp.planilla_produccion_id_planilla = pp.id_planilla AND dp.talle = dor.talle
            GROUP BY ofab.id_orden, ofab.numero_orden, prod.nombre_producto,
                     dor.talle, dor.cantidad_pares
            ORDER BY ofab.numero_orden, CAST(dor.talle AS UNSIGNED)
            """
        )
        ordenes = {}
        for fila in cursor.fetchall():
            id_orden = fila["id_orden"]
            if id_orden not in ordenes:
                ordenes[id_orden] = {
                    "id_orden": id_orden,
                    "numero_orden": fila["numero_orden"],
                    "producto": fila["producto"],
                    "talles": {},
                    "total_pendiente": 0,
                }
            pendiente = max(int(fila["planificados"] or 0) - int(fila["producidos"] or 0), 0)
            ordenes[id_orden]["talles"][str(fila["talle"])] = pendiente
            ordenes[id_orden]["total_pendiente"] += pendiente
        return jsonify(list(ordenes.values())), 200
    finally:
        cursor.close()
        conn.close()


def listar_distribucion_planillas():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT pdl.planilla_produccion_id_planilla AS id_planilla,
                   COUNT(DISTINCT pdb.maquinas_id_maquina) AS cantidad_inyectoras,
                   GROUP_CONCAT(DISTINCT m.nombre_maquina ORDER BY m.nombre_maquina SEPARATOR ' | ') AS inyectoras
            FROM produccion_diaria_linea pdl
            INNER JOIN produccion_diaria_bloque pdb ON pdb.id_bloque = pdl.bloque_id
            INNER JOIN maquinas m ON m.id_maquina = pdb.maquinas_id_maquina
            GROUP BY pdl.planilla_produccion_id_planilla
            """
        )
        return jsonify(serializar_filas(cursor.fetchall())), 200
    finally:
        cursor.close()
        conn.close()


def desglose_por_planilla(id_planilla):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT pdl.id_linea, pd.fecha, m.nombre_maquina AS maquina,
                   pd.operario_calzado, pd.operario_puntera, pdb.operario_inyeccion,
                   dpd.talle, dpd.cantidad_pares,
                   mp.material AS material_puntera, cp.color AS color_puntera, rp.numero_remito AS remito_puntera,
                   mu.material AS material_pu, cu.color AS color_pu, ru.numero_remito AS remito_pu
            FROM produccion_diaria_linea pdl
            INNER JOIN produccion_diaria_bloque pdb ON pdb.id_bloque = pdl.bloque_id
            INNER JOIN produccion_diaria pd ON pd.id_produccion_diaria = pdb.produccion_diaria_id
            INNER JOIN maquinas m ON m.id_maquina = pdb.maquinas_id_maquina
            INNER JOIN detalle_produccion_diaria dpd ON dpd.linea_id = pdl.id_linea
            INNER JOIN lote_materiales lp ON lp.id_lote = pdl.lote_puntera_id
            INNER JOIN materiales mp ON mp.id_material = lp.materiales_id_material
            LEFT JOIN colores cp ON cp.id_color = lp.colores_id_color
            INNER JOIN remitos rp ON rp.id_remito = lp.remitos_id_remito
            INNER JOIN lote_materiales lu ON lu.id_lote = pdl.lote_pu_id
            INNER JOIN materiales mu ON mu.id_material = lu.materiales_id_material
            LEFT JOIN colores cu ON cu.id_color = lu.colores_id_color
            INNER JOIN remitos ru ON ru.id_remito = lu.remitos_id_remito
            WHERE pdl.planilla_produccion_id_planilla = %s
            ORDER BY pd.fecha, pdl.id_linea, CAST(dpd.talle AS UNSIGNED)
            """,
            (id_planilla,),
        )
        lineas = {}
        for fila in cursor.fetchall():
            clave = fila["maquina"]
            if clave not in lineas:
                lineas[clave] = {
                    "id_linea": fila["id_linea"],
                    "maquina": fila["maquina"],
                    "jornadas": {},
                    "total_pares": 0,
                }
            grupo = lineas[clave]
            fecha = fila["fecha"].isoformat() if hasattr(fila["fecha"], "isoformat") else fila["fecha"]
            if fecha not in grupo["jornadas"]:
                grupo["jornadas"][fecha] = {
                    "fecha": fecha,
                    "operarios_calzado": [],
                    "operarios_puntera": [],
                    "operarios_inyeccion": [],
                    "punteras": [],
                    "pus": [],
                    "talles_acumulados": {},
                    "total_pares": 0,
                }
            jornada = grupo["jornadas"][fecha]
            for campo, valor in (
                ("operarios_calzado", fila["operario_calzado"]),
                ("operarios_puntera", fila["operario_puntera"]),
                ("operarios_inyeccion", fila["operario_inyeccion"]),
            ):
                for nombre in valor.split(" | "):
                    if nombre not in jornada[campo]:
                        jornada[campo].append(nombre)
            puntera = {"material": fila["material_puntera"], "color": fila["color_puntera"], "remito": fila["remito_puntera"]}
            pu = {"material": fila["material_pu"], "color": fila["color_pu"], "remito": fila["remito_pu"]}
            if puntera not in jornada["punteras"]:
                jornada["punteras"].append(puntera)
            if pu not in jornada["pus"]:
                jornada["pus"].append(pu)
            talle = str(fila["talle"])
            cantidad = int(fila["cantidad_pares"] or 0)
            jornada["talles_acumulados"][talle] = jornada["talles_acumulados"].get(talle, 0) + cantidad
            jornada["total_pares"] += cantidad
            grupo["total_pares"] += cantidad
        resultado = []
        for grupo in lineas.values():
            jornadas = []
            for jornada in grupo["jornadas"].values():
                jornada["talles"] = [{"talle": talle, "cantidad_pares": cantidad} for talle, cantidad in jornada.pop("talles_acumulados").items()]
                jornadas.append(jornada)
            grupo["jornadas"] = jornadas
            resultado.append(grupo)
        return jsonify(serializar_filas(resultado)), 200
    finally:
        cursor.close()
        conn.close()


def _texto(data, campo):
    return str(data.get(campo) or "").strip()


def _lista_textos(data, campo_plural, campo_anterior=None):
    valores = data.get(campo_plural)
    if not isinstance(valores, list):
        valores = [data.get(campo_anterior)] if campo_anterior else []
    return list(dict.fromkeys(str(valor or "").strip() for valor in valores if str(valor or "").strip()))


def crear_produccion_diaria():
    data = request.json or {}
    fecha = data.get("fecha")
    operarios_calzado = _lista_textos(data, "operarios_calzado", "operario_calzado")
    operarios_puntera = _lista_textos(data, "operarios_puntera", "operario_puntera")
    bloques = data.get("bloques") or []

    if not fecha or not operarios_calzado or not operarios_puntera or not bloques:
        return jsonify({"mensaje": "Completá la fecha, los operarios y al menos una inyectora."}), 400

    lineas_validas = []
    try:
        for bloque in bloques:
            id_maquina = int(bloque.get("maquinas_id_maquina"))
            operarios_inyeccion = _lista_textos(bloque, "operarios_inyeccion", "operario_inyeccion")
            if id_maquina <= 0 or not operarios_inyeccion:
                raise ValueError("Cada bloque debe tener inyectora y operario de inyección.")
            lineas = []
            for linea in bloque.get("lineas") or []:
                id_orden = int(linea.get("orden_fabricacion_id_orden"))
                id_puntera = int(linea.get("lote_puntera_id"))
                id_pu = int(linea.get("lote_pu_id"))
                talles = [(str(item.get("talle")), int(item.get("cantidad_pares") or 0)) for item in linea.get("talles") or []]
                talles = [(talle, cantidad) for talle, cantidad in talles if cantidad > 0]
                if id_orden <= 0 or id_puntera <= 0 or id_pu <= 0 or not talles:
                    raise ValueError("Cada orden debe incluir talles, puntera y PU.")
                lineas.append((id_orden, id_puntera, id_pu, talles))
            if not lineas:
                raise ValueError("Cada inyectora debe tener al menos una orden.")
            lineas_validas.append((id_maquina, operarios_inyeccion, lineas))
    except (TypeError, ValueError) as error:
        return jsonify({"mensaje": str(error) or "Hay datos incompletos en la planilla."}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        solicitado = {}
        for _, _, lineas in lineas_validas:
            for id_orden, _, _, talles in lineas:
                for talle, cantidad in talles:
                    clave = (id_orden, talle)
                    solicitado[clave] = solicitado.get(clave, 0) + cantidad
        for (id_orden, talle), cantidad in solicitado.items():
            cursor.execute(
                """
                SELECT dor.cantidad_pares AS planificados,
                       COALESCE(SUM(dp.cantidad_pares), 0) AS producidos
                FROM detalle_orden dor
                LEFT JOIN planilla_produccion pp
                  ON pp.orden_fabricacion_id_orden = dor.orden_fabricacion_id_orden
                 AND (UPPER(pp.numero_planilla) = 'R013/1' OR pp.tipo_planilla = 'Calzado e Inyección')
                LEFT JOIN detalle_planilla dp
                  ON dp.planilla_produccion_id_planilla = pp.id_planilla AND dp.talle = dor.talle
                WHERE dor.orden_fabricacion_id_orden = %s AND dor.talle = %s
                GROUP BY dor.id_detalle_orden, dor.cantidad_pares
                """,
                (id_orden, talle),
            )
            disponibilidad = cursor.fetchone()
            pendiente = max(int(disponibilidad["planificados"] or 0) - int(disponibilidad["producidos"] or 0), 0) if disponibilidad else 0
            if cantidad > pendiente:
                raise ValueError(f"La orden seleccionada solo tiene {pendiente} pares pendientes para el talle {talle}.")

        cursor.execute(
            "INSERT INTO produccion_diaria (fecha, operario_calzado, operario_puntera) VALUES (%s, %s, %s)",
            (fecha, " | ".join(operarios_calzado), " | ".join(operarios_puntera)),
        )
        id_diaria = cursor.lastrowid
        planillas_afectadas = set()

        for id_maquina, operarios_inyeccion, lineas in lineas_validas:
            cursor.execute(
                "INSERT INTO produccion_diaria_bloque (produccion_diaria_id, maquinas_id_maquina, operario_inyeccion) VALUES (%s, %s, %s)",
                (id_diaria, id_maquina, " | ".join(operarios_inyeccion)),
            )
            id_bloque = cursor.lastrowid

            for id_orden, id_puntera, id_pu, talles in lineas:
                cursor.execute(
                    """
                    SELECT id_planilla FROM planilla_produccion
                    WHERE orden_fabricacion_id_orden = %s
                      AND (UPPER(numero_planilla) = 'R013/1' OR tipo_planilla = 'Calzado e Inyección')
                    ORDER BY id_planilla LIMIT 1
                    """,
                    (id_orden,),
                )
                planilla = cursor.fetchone()
                if planilla:
                    id_planilla = planilla["id_planilla"]
                    cursor.execute(
                        "UPDATE planilla_produccion SET estado = 'En proceso' WHERE id_planilla = %s",
                        (id_planilla,),
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO planilla_produccion
                          (orden_fabricacion_id_orden, numero_planilla, fecha, tipo_planilla, maquinas_id_maquina, estado)
                        VALUES (%s, 'R013/1', %s, 'Calzado e Inyección', %s, 'En proceso')
                        """,
                        (id_orden, fecha, id_maquina),
                    )
                    id_planilla = cursor.lastrowid
                planillas_afectadas.add(id_planilla)

                cursor.execute(
                    """
                    INSERT INTO produccion_diaria_linea
                      (bloque_id, orden_fabricacion_id_orden, planilla_produccion_id_planilla, lote_puntera_id, lote_pu_id)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (id_bloque, id_orden, id_planilla, id_puntera, id_pu),
                )
                id_linea = cursor.lastrowid

                for talle, cantidad in talles:
                    cursor.execute(
                        "INSERT INTO detalle_produccion_diaria (linea_id, talle, cantidad_pares) VALUES (%s, %s, %s)",
                        (id_linea, talle, cantidad),
                    )
                    cursor.execute(
                        """
                        SELECT id_detalle FROM detalle_planilla
                        WHERE planilla_produccion_id_planilla = %s AND talle = %s
                        ORDER BY id_detalle LIMIT 1
                        """,
                        (id_planilla, talle),
                    )
                    detalle = cursor.fetchone()
                    if detalle:
                        cursor.execute(
                            "UPDATE detalle_planilla SET cantidad_pares = cantidad_pares + %s WHERE id_detalle = %s",
                            (cantidad, detalle["id_detalle"]),
                        )
                    else:
                        cursor.execute(
                            "INSERT INTO detalle_planilla (planilla_produccion_id_planilla, talle, cantidad_pares) VALUES (%s, %s, %s)",
                            (id_planilla, talle, cantidad),
                        )

                operarios_etapa = [
                    *[("Calzado", nombre) for nombre in operarios_calzado],
                    *[("Puntera", nombre) for nombre in operarios_puntera],
                    *[("Inyección", nombre) for nombre in operarios_inyeccion],
                ]
                for etapa, nombre in operarios_etapa:
                    cursor.execute(
                        "SELECT 1 FROM operarios_planilla WHERE planilla_produccion_id_planilla = %s AND etapa = %s AND nombre_operario = %s LIMIT 1",
                        (id_planilla, etapa, nombre),
                    )
                    if not cursor.fetchone():
                        cursor.execute(
                            "INSERT INTO operarios_planilla (etapa, nombre_operario, planilla_produccion_id_planilla) VALUES (%s, %s, %s)",
                            (etapa, nombre, id_planilla),
                        )

                for id_lote in (id_puntera, id_pu):
                    cursor.execute(
                        "SELECT 1 FROM uso_materiales WHERE planilla_produccion_id_planilla = %s AND lote_materiales_id_lote = %s LIMIT 1",
                        (id_planilla, id_lote),
                    )
                    if not cursor.fetchone():
                        cursor.execute(
                            "INSERT INTO uso_materiales (lote_materiales_id_lote, planilla_produccion_id_planilla, cantidad_usada) VALUES (%s, %s, 0)",
                            (id_lote, id_planilla),
                        )

        for id_planilla in planillas_afectadas:
            cursor.execute(
                """
                SELECT COUNT(*) AS talles_pendientes
                FROM detalle_orden dor
                INNER JOIN planilla_produccion pp
                  ON pp.id_planilla = %s
                 AND pp.orden_fabricacion_id_orden = dor.orden_fabricacion_id_orden
                LEFT JOIN (
                  SELECT talle, SUM(cantidad_pares) AS producidos
                  FROM detalle_planilla
                  WHERE planilla_produccion_id_planilla = %s
                  GROUP BY talle
                ) realizado ON realizado.talle = dor.talle
                WHERE COALESCE(realizado.producidos, 0) < dor.cantidad_pares
                """,
                (id_planilla, id_planilla),
            )
            finalizada = cursor.fetchone()["talles_pendientes"] == 0
            cursor.execute(
                "UPDATE planilla_produccion SET estado = %s WHERE id_planilla = %s",
                ("Finalizada" if finalizada else "En proceso", id_planilla),
            )
            cursor.execute(
                """
                UPDATE planilla_produccion r013
                INNER JOIN planilla_produccion r013_1
                  ON r013_1.id_planilla = %s
                 AND r013.orden_fabricacion_id_orden = r013_1.orden_fabricacion_id_orden
                SET r013.estado = %s
                WHERE UPPER(r013.numero_planilla) = 'R013' OR r013.tipo_planilla = 'Corte y Aparado'
                """,
                (id_planilla, "Finalizada" if finalizada else "En proceso"),
            )

        conn.commit()
        return jsonify({"id_produccion_diaria": id_diaria, "planillas_actualizadas": len(planillas_afectadas), "mensaje": "Producción diaria registrada correctamente"}), 201
    except ValueError as error:
        if conn:
            conn.rollback()
        return jsonify({"mensaje": str(error)}), 400
    except Exception as error:
        if conn:
            conn.rollback()
        return jsonify({"mensaje": f"No se pudo guardar la producción diaria: {error}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
