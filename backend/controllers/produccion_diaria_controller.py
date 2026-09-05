from flask import jsonify, request

from db.connection import get_connection
from utils.db_helpers import serializar_filas


def _asegurar_esquema_variantes(cursor):
    """Actualiza instalaciones existentes antes de guardar la primera variante."""
    cursor.execute("""
      CREATE TABLE IF NOT EXISTS producto_variante (
        id_variante INT AUTO_INCREMENT PRIMARY KEY,
        producto_id_producto INT NOT NULL,
        punteras_id_puntera INT NOT NULL,
        articulo_producto VARCHAR(45) NOT NULL,
        adicionales_firma VARCHAR(255) NOT NULL DEFAULT '',
        activo TINYINT(1) NOT NULL DEFAULT 1,
        UNIQUE KEY uq_variante_articulo (articulo_producto),
        UNIQUE KEY uq_variante_combinacion (producto_id_producto,punteras_id_puntera,adicionales_firma),
        CONSTRAINT fk_variante_producto FOREIGN KEY (producto_id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE,
        CONSTRAINT fk_variante_puntera FOREIGN KEY (punteras_id_puntera) REFERENCES punteras(id_puntera) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    cursor.execute("""
      CREATE TABLE IF NOT EXISTS producto_variante_adicional (
        variante_id_variante INT NOT NULL,
        adicionales_id_adicional INT NOT NULL,
        orden INT NOT NULL,
        PRIMARY KEY (variante_id_variante,adicionales_id_adicional),
        UNIQUE KEY uq_variante_adicional_orden (variante_id_variante,orden),
        CONSTRAINT fk_pva_variante FOREIGN KEY (variante_id_variante) REFERENCES producto_variante(id_variante) ON DELETE CASCADE,
        CONSTRAINT fk_pva_adicional FOREIGN KEY (adicionales_id_adicional) REFERENCES adicionales(id_adicional) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    cursor.execute("""SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='produccion_diaria_linea'
        AND COLUMN_NAME='producto_variante_id_variante'""")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE produccion_diaria_linea ADD producto_variante_id_variante INT NULL AFTER orden_fabricacion_id_orden")
        cursor.execute("ALTER TABLE produccion_diaria_linea ADD KEY idx_pdl_variante (producto_variante_id_variante)")
        cursor.execute("ALTER TABLE produccion_diaria_linea ADD CONSTRAINT fk_pdl_variante FOREIGN KEY (producto_variante_id_variante) REFERENCES producto_variante(id_variante) ON DELETE RESTRICT")
    cursor.execute("""
      CREATE TABLE IF NOT EXISTS produccion_diaria_linea_material (
        id_linea_material INT AUTO_INCREMENT PRIMARY KEY,
        linea_id INT NOT NULL,
        lote_materiales_id_lote INT NOT NULL,
        rol VARCHAR(30) NOT NULL DEFAULT 'Adicional',
        KEY idx_pdlm_linea (linea_id),
        CONSTRAINT fk_pdlm_linea FOREIGN KEY (linea_id) REFERENCES produccion_diaria_linea(id_linea) ON DELETE CASCADE,
        CONSTRAINT fk_pdlm_lote FOREIGN KEY (lote_materiales_id_lote) REFERENCES lote_materiales(id_lote) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)


def listar_producciones_diarias():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT pdl.id_linea, ofab.id_orden, ofab.numero_orden,
                   COALESCE(pv.articulo_producto, prod.articulo_producto) AS articulo,
                   prod.nombre_producto AS producto,
                   m.nombre_maquina AS inyectora, pd.fecha,
                   COALESCE(SUM(dpdl.cantidad_pares), 0) AS total_pares
            FROM produccion_diaria pd
            INNER JOIN produccion_diaria_bloque pdb
              ON pdb.produccion_diaria_id = pd.id_produccion_diaria
            INNER JOIN maquinas m ON m.id_maquina = pdb.maquinas_id_maquina
            INNER JOIN produccion_diaria_linea pdl ON pdl.bloque_id = pdb.id_bloque
            INNER JOIN orden_fabricacion ofab ON ofab.id_orden = pdl.orden_fabricacion_id_orden
            INNER JOIN producto prod ON prod.id_producto = ofab.producto_id_producto
            LEFT JOIN producto_variante pv ON pv.id_variante = pdl.producto_variante_id_variante
            LEFT JOIN detalle_produccion_diaria dpdl ON dpdl.linea_id = pdl.id_linea
            GROUP BY pdl.id_linea, ofab.id_orden, ofab.numero_orden, pv.articulo_producto, prod.articulo_producto,
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
                   mc.codigo_modelo, col.codigo_color,
                   dor.talle, dor.cantidad_pares AS planificados,
                   COALESCE(SUM(dp.cantidad_pares), 0) AS producidos
            FROM orden_fabricacion ofab
            INNER JOIN producto prod ON prod.id_producto = ofab.producto_id_producto
            LEFT JOIN modelos_calzado mc ON mc.id_modelo = prod.modelos_calzado_id_modelo
            LEFT JOIN colores col ON col.id_color = prod.colores_id_color
            INNER JOIN detalle_orden dor ON dor.orden_fabricacion_id_orden = ofab.id_orden
            LEFT JOIN planilla_produccion pp
              ON pp.orden_fabricacion_id_orden = ofab.id_orden
             AND (UPPER(pp.numero_planilla) = 'R013/1' OR pp.tipo_planilla = 'Calzado e Inyección')
            LEFT JOIN detalle_planilla dp ON dp.planilla_produccion_id_planilla = pp.id_planilla AND dp.talle = dor.talle
            GROUP BY ofab.id_orden, ofab.numero_orden, prod.nombre_producto, mc.codigo_modelo, col.codigo_color,
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
                    "codigo_modelo": fila["codigo_modelo"],
                    "codigo_color": fila["codigo_color"],
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


def detalle_linea_produccion(id_linea):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
          SELECT pdl.id_linea,pd.fecha,ofab.numero_orden,prod.nombre_producto AS producto,
                 COALESCE(pv.articulo_producto,prod.articulo_producto) AS articulo,
                 pt.nombre_puntera,pd.operario_calzado,pd.operario_puntera,
                 pdb.operario_inyeccion,m.nombre_maquina AS inyectora,
                 mp.material AS material_puntera,cp.color AS color_puntera,rp.numero_remito AS remito_puntera,
                 mu.material AS material_pu,cu.color AS color_pu,ru.numero_remito AS remito_pu,
                 (SELECT GROUP_CONCAT(a.nombre_adicional ORDER BY pva.orden SEPARATOR ', ')
                    FROM producto_variante_adicional pva
                    INNER JOIN adicionales a ON a.id_adicional=pva.adicionales_id_adicional
                   WHERE pva.variante_id_variante=pv.id_variante) AS adicionales
          FROM produccion_diaria_linea pdl
          INNER JOIN produccion_diaria_bloque pdb ON pdb.id_bloque=pdl.bloque_id
          INNER JOIN produccion_diaria pd ON pd.id_produccion_diaria=pdb.produccion_diaria_id
          INNER JOIN maquinas m ON m.id_maquina=pdb.maquinas_id_maquina
          INNER JOIN orden_fabricacion ofab ON ofab.id_orden=pdl.orden_fabricacion_id_orden
          INNER JOIN producto prod ON prod.id_producto=ofab.producto_id_producto
          LEFT JOIN producto_variante pv ON pv.id_variante=pdl.producto_variante_id_variante
          LEFT JOIN punteras pt ON pt.id_puntera=pv.punteras_id_puntera
          INNER JOIN lote_materiales lp ON lp.id_lote=pdl.lote_puntera_id
          INNER JOIN materiales mp ON mp.id_material=lp.materiales_id_material
          LEFT JOIN colores cp ON cp.id_color=lp.colores_id_color
          INNER JOIN remitos rp ON rp.id_remito=lp.remitos_id_remito
          INNER JOIN lote_materiales lu ON lu.id_lote=pdl.lote_pu_id
          INNER JOIN materiales mu ON mu.id_material=lu.materiales_id_material
          LEFT JOIN colores cu ON cu.id_color=lu.colores_id_color
          INNER JOIN remitos ru ON ru.id_remito=lu.remitos_id_remito
          WHERE pdl.id_linea=%s
        """, (id_linea,))
        detalle = cursor.fetchone()
        if not detalle:
            return jsonify({"mensaje": "Producción no encontrada"}), 404
        cursor.execute("SELECT talle,cantidad_pares FROM detalle_produccion_diaria WHERE linea_id=%s ORDER BY CAST(talle AS UNSIGNED)", (id_linea,))
        detalle["talles"] = cursor.fetchall()
        cursor.execute("""
          SELECT lm.rol,mat.material,c.color,r.numero_remito
          FROM produccion_diaria_linea_material lm
          INNER JOIN lote_materiales l ON l.id_lote=lm.lote_materiales_id_lote
          INNER JOIN materiales mat ON mat.id_material=l.materiales_id_material
          LEFT JOIN colores c ON c.id_color=l.colores_id_color
          INNER JOIN remitos r ON r.id_remito=l.remitos_id_remito
          WHERE lm.linea_id=%s ORDER BY lm.id_linea_material
        """, (id_linea,))
        detalle["otros_materiales"] = cursor.fetchall()
        return jsonify(serializar_filas([detalle])[0]), 200
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
                   pv.articulo_producto, pt.nombre_puntera,
                   (SELECT GROUP_CONCAT(a.nombre_adicional ORDER BY pva.orden SEPARATOR ', ')
                      FROM producto_variante_adicional pva
                      INNER JOIN adicionales a ON a.id_adicional=pva.adicionales_id_adicional
                     WHERE pva.variante_id_variante=pv.id_variante) AS adicionales_variante,
                   mp.material AS material_puntera, cp.color AS color_puntera, rp.numero_remito AS remito_puntera,
                   provp.nombre_proveedor AS proveedor_puntera,
                   mu.material AS material_pu, cu.color AS color_pu, ru.numero_remito AS remito_pu,
                   provu.nombre_proveedor AS proveedor_pu
            FROM produccion_diaria_linea pdl
            INNER JOIN produccion_diaria_bloque pdb ON pdb.id_bloque = pdl.bloque_id
            INNER JOIN produccion_diaria pd ON pd.id_produccion_diaria = pdb.produccion_diaria_id
            INNER JOIN maquinas m ON m.id_maquina = pdb.maquinas_id_maquina
            INNER JOIN detalle_produccion_diaria dpd ON dpd.linea_id = pdl.id_linea
            LEFT JOIN producto_variante pv ON pv.id_variante=pdl.producto_variante_id_variante
            LEFT JOIN punteras pt ON pt.id_puntera=pv.punteras_id_puntera
            INNER JOIN lote_materiales lp ON lp.id_lote = pdl.lote_puntera_id
            INNER JOIN materiales mp ON mp.id_material = lp.materiales_id_material
            LEFT JOIN colores cp ON cp.id_color = lp.colores_id_color
            INNER JOIN remitos rp ON rp.id_remito = lp.remitos_id_remito
            INNER JOIN proveedores provp ON provp.id_proveedor = rp.proveedores_id_proveedor
            INNER JOIN lote_materiales lu ON lu.id_lote = pdl.lote_pu_id
            INNER JOIN materiales mu ON mu.id_material = lu.materiales_id_material
            LEFT JOIN colores cu ON cu.id_color = lu.colores_id_color
            INNER JOIN remitos ru ON ru.id_remito = lu.remitos_id_remito
            INNER JOIN proveedores provu ON provu.id_proveedor = ru.proveedores_id_proveedor
            WHERE pdl.planilla_produccion_id_planilla = %s
            ORDER BY pd.fecha, pdl.id_linea, CAST(dpd.talle AS UNSIGNED)
            """,
            (id_planilla,),
        )
        filas = cursor.fetchall()
        ids_linea = list({fila["id_linea"] for fila in filas})
        extras_por_linea = {}
        if ids_linea:
            marcas = ",".join(["%s"] * len(ids_linea))
            cursor.execute(f"""
              SELECT lm.linea_id,lm.rol,mat.material,c.color,r.numero_remito,p.nombre_proveedor
              FROM produccion_diaria_linea_material lm
              INNER JOIN lote_materiales l ON l.id_lote=lm.lote_materiales_id_lote
              INNER JOIN materiales mat ON mat.id_material=l.materiales_id_material
              LEFT JOIN colores c ON c.id_color=l.colores_id_color
              INNER JOIN remitos r ON r.id_remito=l.remitos_id_remito
              INNER JOIN proveedores p ON p.id_proveedor=r.proveedores_id_proveedor
              WHERE lm.linea_id IN ({marcas}) ORDER BY lm.id_linea_material
            """, tuple(ids_linea))
            for extra in cursor.fetchall():
                extras_por_linea.setdefault(extra["linea_id"], []).append(extra)
        lineas = {}
        for fila in filas:
            clave = fila["id_linea"]
            if clave not in lineas:
                lineas[clave] = {
                    "id_linea": fila["id_linea"],
                    "maquina": fila["maquina"],
                    "articulo": fila["articulo_producto"],
                    "tipo_puntera": fila["nombre_puntera"],
                    "adicionales": fila["adicionales_variante"],
                    "materiales_extra": extras_por_linea.get(fila["id_linea"], []),
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
            puntera = {"material": fila["material_puntera"], "color": fila["color_puntera"], "remito": fila["remito_puntera"], "proveedor": fila["proveedor_puntera"]}
            pu = {"material": fila["material_pu"], "color": fila["color_pu"], "remito": fila["remito_pu"], "proveedor": fila["proveedor_pu"]}
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


def _obtener_o_crear_variante(cursor, id_orden, id_puntera, adicionales_seleccionados):
    adicionales = []
    for valor in adicionales_seleccionados or []:
        valor = int(valor)
        if valor > 0 and valor not in adicionales: adicionales.append(valor)
    cursor.execute("""SELECT p.id_producto,m.codigo_modelo,c.codigo_color,pu.codigo_puntera
      FROM orden_fabricacion o INNER JOIN producto p ON p.id_producto=o.producto_id_producto
      INNER JOIN modelos_calzado m ON m.id_modelo=p.modelos_calzado_id_modelo
      INNER JOIN colores c ON c.id_color=p.colores_id_color
      INNER JOIN punteras pu ON pu.id_puntera=%s AND pu.activo=1 WHERE o.id_orden=%s""", (id_puntera, id_orden))
    base = cursor.fetchone()
    if not base: raise ValueError("La orden o el tipo de puntera no son válidos.")
    codigos = []
    if adicionales:
        marcas = ",".join(["%s"] * len(adicionales)); cursor.execute(f"SELECT id_adicional,codigo_adicional FROM adicionales WHERE activo=1 AND id_adicional IN ({marcas})", tuple(adicionales)); mapa = {x["id_adicional"]: x["codigo_adicional"] for x in cursor.fetchall()}
        if len(mapa) != len(adicionales): raise ValueError("Uno de los adicionales no es válido.")
        codigos = [mapa[x] for x in adicionales]
    firma = ",".join(map(str, adicionales)); cursor.execute("SELECT id_variante FROM producto_variante WHERE producto_id_producto=%s AND punteras_id_puntera=%s AND adicionales_firma=%s", (base["id_producto"], id_puntera, firma)); existente = cursor.fetchone()
    if existente: return existente["id_variante"]
    articulo = base["codigo_modelo"] + base["codigo_puntera"] + "".join(codigos) + base["codigo_color"]
    cursor.execute("INSERT INTO producto_variante (producto_id_producto,punteras_id_puntera,articulo_producto,adicionales_firma) VALUES (%s,%s,%s,%s)", (base["id_producto"], id_puntera, articulo, firma)); id_variante = cursor.lastrowid
    if adicionales: cursor.executemany("INSERT INTO producto_variante_adicional (variante_id_variante,adicionales_id_adicional,orden) VALUES (%s,%s,%s)", [(id_variante, x, i) for i, x in enumerate(adicionales, 1)])
    return id_variante


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
                id_tipo_puntera = int(linea.get("punteras_id_puntera"))
                id_puntera = int(linea.get("lote_puntera_id"))
                id_pu = int(linea.get("lote_pu_id"))
                materiales_extra = linea.get("materiales_extra") or []
                adicionales_linea = linea.get("adicionales") or []
                for material in materiales_extra:
                    if int(material.get("lote_id") or 0) <= 0: raise ValueError("Cada material adicional debe tener un remito seleccionado.")
                talles = [(str(item.get("talle")), int(item.get("cantidad_pares") or 0)) for item in linea.get("talles") or []]
                talles = [(talle, cantidad) for talle, cantidad in talles if cantidad > 0]
                if id_orden <= 0 or id_tipo_puntera <= 0 or id_puntera <= 0 or id_pu <= 0 or not talles:
                    raise ValueError("Cada orden debe incluir talles, puntera y PU.")
                lineas.append((id_orden, id_tipo_puntera, id_puntera, id_pu, adicionales_linea, materiales_extra, talles))
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
        _asegurar_esquema_variantes(cursor)

        solicitado = {}
        for _, _, lineas in lineas_validas:
            for id_orden, _, _, _, _, _, talles in lineas:
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

            for id_orden, id_tipo_puntera, id_puntera, id_pu, adicionales_linea, materiales_extra, talles in lineas:
                id_variante = _obtener_o_crear_variante(cursor, id_orden, id_tipo_puntera, adicionales_linea)
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
                      (bloque_id, orden_fabricacion_id_orden, producto_variante_id_variante, planilla_produccion_id_planilla, lote_puntera_id, lote_pu_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (id_bloque, id_orden, id_variante, id_planilla, id_puntera, id_pu),
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

                for material in materiales_extra:
                    cursor.execute("INSERT INTO produccion_diaria_linea_material (linea_id,lote_materiales_id_lote,rol) VALUES (%s,%s,'Otro material')", (id_linea, int(material["lote_id"])))

                for id_lote in (id_puntera, id_pu, *[int(material["lote_id"]) for material in materiales_extra]):
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
