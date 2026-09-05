import logging

from db.connection import get_connection


LOGGER = logging.getLogger(__name__)
LOCK_NAME = "orden_fabricacion_schema_migrations"

REPORTING_PROCEDURES = {
    "sp_listar_usos_materiales": """
        CREATE PROCEDURE sp_listar_usos_materiales()
        BEGIN
          SELECT
            um.id_uso,
            um.lote_materiales_id_lote,
            lm.codigo_lote,
            lm.materiales_id_material,
            mat.material,
            lm.colores_id_color,
            col.color,
            lm.cantidad_recibida,
            lm.observaciones,
            r.id_remito,
            r.numero_remito,
            r.fecha_solicitud,
            r.fecha_entrega,
            r.estado_recepcion,
            r.recibido_por,
            prov.id_proveedor,
            prov.nombre_proveedor,
            um.planilla_produccion_id_planilla,
            pp.numero_planilla,
            ofab.numero_orden,
            prod.nombre_producto AS producto,
            um.cantidad_usada
          FROM uso_materiales um
          INNER JOIN lote_materiales lm
            ON um.lote_materiales_id_lote = lm.id_lote
          INNER JOIN materiales mat
            ON lm.materiales_id_material = mat.id_material
          LEFT JOIN colores col
            ON lm.colores_id_color = col.id_color
          INNER JOIN remitos r
            ON lm.remitos_id_remito = r.id_remito
          INNER JOIN proveedores prov
            ON r.proveedores_id_proveedor = prov.id_proveedor
          INNER JOIN planilla_produccion pp
            ON um.planilla_produccion_id_planilla = pp.id_planilla
          INNER JOIN orden_fabricacion ofab
            ON pp.orden_fabricacion_id_orden = ofab.id_orden
          INNER JOIN producto prod
            ON ofab.producto_id_producto = prod.id_producto
          ORDER BY um.id_uso DESC;
        END
    """,
    "sp_listar_lotes": """
        CREATE PROCEDURE sp_listar_lotes()
        BEGIN
          SELECT
            l.id_lote,
            l.remitos_id_remito,
            r.numero_remito,
            r.fecha_solicitud,
            r.fecha_entrega,
            r.estado_recepcion,
            r.recibido_por,
            r.proveedores_id_proveedor,
            p.nombre_proveedor,
            l.materiales_id_material,
            m.material,
            l.colores_id_color,
            c.color,
            l.cantidad_solicitada,
            l.cantidad_recibida,
            l.pendiente,
            l.observaciones
          FROM lote_materiales l
          INNER JOIN remitos r
            ON l.remitos_id_remito = r.id_remito
          INNER JOIN proveedores p
            ON r.proveedores_id_proveedor = p.id_proveedor
          INNER JOIN materiales m
            ON l.materiales_id_material = m.id_material
          LEFT JOIN colores c
            ON l.colores_id_color = c.id_color
          ORDER BY l.id_lote DESC;
        END
    """,
    "sp_materiales_por_orden": """
        CREATE PROCEDURE sp_materiales_por_orden(IN p_id_orden INT)
        BEGIN
          SELECT
            ofab.id_orden,
            ofab.numero_orden,
            prod.id_producto,
            prod.articulo_producto,
            prod.nombre_producto AS producto,
            pp.id_planilla,
            pp.numero_planilla,
            pp.tipo_planilla,
            lm.id_lote,
            lm.codigo_lote,
            mat.id_material,
            mat.material,
            col.color,
            r.numero_remito,
            prov.nombre_proveedor,
            um.id_uso,
            um.cantidad_usada
          FROM orden_fabricacion ofab
          INNER JOIN producto prod
            ON ofab.producto_id_producto = prod.id_producto
          INNER JOIN planilla_produccion pp
            ON pp.orden_fabricacion_id_orden = ofab.id_orden
          LEFT JOIN uso_materiales um
            ON um.planilla_produccion_id_planilla = pp.id_planilla
          LEFT JOIN lote_materiales lm
            ON um.lote_materiales_id_lote = lm.id_lote
          LEFT JOIN materiales mat
            ON lm.materiales_id_material = mat.id_material
          LEFT JOIN colores col
            ON lm.colores_id_color = col.id_color
          LEFT JOIN remitos r
            ON lm.remitos_id_remito = r.id_remito
          LEFT JOIN proveedores prov
            ON r.proveedores_id_proveedor = prov.id_proveedor
          WHERE ofab.id_orden = p_id_orden
          ORDER BY pp.numero_planilla, mat.material, lm.codigo_lote;
        END
    """,
}


def _index_names(cursor, table_name):
    cursor.execute(
        """
        SELECT DISTINCT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s
        """,
        (table_name,),
    )
    return {row["INDEX_NAME"] for row in cursor.fetchall()}


def _column_definition(cursor, table_name, column_name):
    cursor.execute(
        """
        SELECT COLUMN_TYPE, IS_NULLABLE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = %s
          AND COLUMN_NAME = %s
        """,
        (table_name, column_name),
    )
    return cursor.fetchone()


def _refresh_reporting_procedures(cursor):
    for procedure_name, definition in REPORTING_PROCEDURES.items():
        cursor.execute(f"DROP PROCEDURE IF EXISTS {procedure_name}")
        cursor.execute(definition)
        LOGGER.info("Actualizado el procedimiento %s.", procedure_name)


def migrate_schema(connection=None):
    """Bring an existing database in line with the current install schema."""
    owns_connection = connection is None
    conn = connection or get_connection()
    cursor = conn.cursor(dictionary=True)
    lock_acquired = False

    try:
        cursor.execute("SELECT GET_LOCK(%s, 30) AS acquired", (LOCK_NAME,))
        lock_acquired = cursor.fetchone()["acquired"] == 1
        if not lock_acquired:
            raise RuntimeError("No se pudo obtener el bloqueo para actualizar la base de datos.")

        # Un producto conserva modelo y color; puntera y adicionales forman variantes
        # que se eligen dentro de cada orden.
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS producto_variante (
              id_variante INT AUTO_INCREMENT PRIMARY KEY,
              producto_id_producto INT NOT NULL,
              punteras_id_puntera INT NOT NULL,
              articulo_producto VARCHAR(45) NOT NULL,
              adicionales_firma VARCHAR(255) NOT NULL DEFAULT '',
              activo TINYINT(1) NOT NULL DEFAULT 1,
              UNIQUE KEY uq_variante_articulo (articulo_producto),
              UNIQUE KEY uq_variante_combinacion (producto_id_producto, punteras_id_puntera, adicionales_firma),
              CONSTRAINT fk_variante_producto FOREIGN KEY (producto_id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE,
              CONSTRAINT fk_variante_puntera FOREIGN KEY (punteras_id_puntera) REFERENCES punteras(id_puntera) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS producto_variante_adicional (
              variante_id_variante INT NOT NULL,
              adicionales_id_adicional INT NOT NULL,
              orden INT NOT NULL,
              PRIMARY KEY (variante_id_variante, adicionales_id_adicional),
              UNIQUE KEY uq_variante_adicional_orden (variante_id_variante, orden),
              CONSTRAINT fk_pva_variante FOREIGN KEY (variante_id_variante) REFERENCES producto_variante(id_variante) ON DELETE CASCADE,
              CONSTRAINT fk_pva_adicional FOREIGN KEY (adicionales_id_adicional) REFERENCES adicionales(id_adicional) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS produccion_diaria (
              id_produccion_diaria INT AUTO_INCREMENT PRIMARY KEY,
              fecha DATE NOT NULL,
              operario_calzado VARCHAR(80) NOT NULL,
              operario_puntera VARCHAR(80) NOT NULL,
              creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              KEY idx_produccion_diaria_fecha (fecha)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS produccion_diaria_bloque (
              id_bloque INT AUTO_INCREMENT PRIMARY KEY,
              produccion_diaria_id INT NOT NULL,
              maquinas_id_maquina INT NOT NULL,
              operario_inyeccion VARCHAR(80) NOT NULL,
              KEY idx_pdb_diaria (produccion_diaria_id),
              KEY idx_pdb_maquina (maquinas_id_maquina),
              CONSTRAINT fk_pdb_diaria FOREIGN KEY (produccion_diaria_id)
                REFERENCES produccion_diaria (id_produccion_diaria) ON DELETE CASCADE,
              CONSTRAINT fk_pdb_maquina FOREIGN KEY (maquinas_id_maquina)
                REFERENCES maquinas (id_maquina) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS produccion_diaria_linea (
              id_linea INT AUTO_INCREMENT PRIMARY KEY,
              bloque_id INT NOT NULL,
              orden_fabricacion_id_orden INT NOT NULL,
              planilla_produccion_id_planilla INT NOT NULL,
              lote_puntera_id INT NOT NULL,
              lote_pu_id INT NOT NULL,
              KEY idx_pdl_bloque (bloque_id),
              KEY idx_pdl_orden (orden_fabricacion_id_orden),
              CONSTRAINT fk_pdl_bloque FOREIGN KEY (bloque_id)
                REFERENCES produccion_diaria_bloque (id_bloque) ON DELETE CASCADE,
              CONSTRAINT fk_pdl_orden FOREIGN KEY (orden_fabricacion_id_orden)
                REFERENCES orden_fabricacion (id_orden) ON DELETE RESTRICT,
              CONSTRAINT fk_pdl_planilla FOREIGN KEY (planilla_produccion_id_planilla)
                REFERENCES planilla_produccion (id_planilla) ON DELETE RESTRICT,
              CONSTRAINT fk_pdl_puntera FOREIGN KEY (lote_puntera_id)
                REFERENCES lote_materiales (id_lote) ON DELETE RESTRICT,
              CONSTRAINT fk_pdl_pu FOREIGN KEY (lote_pu_id)
                REFERENCES lote_materiales (id_lote) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS detalle_produccion_diaria (
              id_detalle_produccion INT AUTO_INCREMENT PRIMARY KEY,
              linea_id INT NOT NULL,
              talle VARCHAR(10) NOT NULL,
              cantidad_pares INT NOT NULL,
              UNIQUE KEY uq_dpd_linea_talle (linea_id, talle),
              CONSTRAINT fk_dpd_linea FOREIGN KEY (linea_id)
                REFERENCES produccion_diaria_linea (id_linea) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        )
        if not _column_definition(cursor, "produccion_diaria_linea", "producto_variante_id_variante"):
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
        cursor.execute("ALTER TABLE produccion_diaria MODIFY operario_calzado TEXT NOT NULL")
        cursor.execute("ALTER TABLE produccion_diaria MODIFY operario_puntera TEXT NOT NULL")
        cursor.execute("ALTER TABLE produccion_diaria_bloque MODIFY operario_inyeccion TEXT NOT NULL")

        cursor.execute(
            """
            SELECT id_planilla, orden_fabricacion_id_orden
            FROM planilla_produccion
            WHERE UPPER(numero_planilla) = 'R013/1' OR tipo_planilla = 'Calzado e Inyección'
            """
        )
        planillas_r013_1 = cursor.fetchall()
        for planilla in planillas_r013_1:
            cursor.execute(
                """
                SELECT COUNT(*) AS talles_pendientes
                FROM detalle_orden dor
                LEFT JOIN (
                  SELECT talle, SUM(cantidad_pares) AS producidos
                  FROM detalle_planilla
                  WHERE planilla_produccion_id_planilla = %s
                  GROUP BY talle
                ) realizado ON realizado.talle = dor.talle
                WHERE dor.orden_fabricacion_id_orden = %s
                  AND COALESCE(realizado.producidos, 0) < dor.cantidad_pares
                """,
                (planilla["id_planilla"], planilla["orden_fabricacion_id_orden"]),
            )
            estado = "Finalizada" if cursor.fetchone()["talles_pendientes"] == 0 else "En proceso"
            cursor.execute("UPDATE planilla_produccion SET estado = %s WHERE id_planilla = %s", (estado, planilla["id_planilla"]))
            cursor.execute(
                """
                UPDATE planilla_produccion SET estado = %s
                WHERE orden_fabricacion_id_orden = %s
                  AND (UPPER(numero_planilla) = 'R013' OR tipo_planilla = 'Corte y Aparado')
                """,
                (estado, planilla["orden_fabricacion_id_orden"]),
            )

        remito_indexes = _index_names(cursor, "remitos")
        if "uq_remito_proveedor" not in remito_indexes:
            cursor.execute(
                """
                SELECT numero_remito, proveedores_id_proveedor, COUNT(*) AS cantidad
                FROM remitos
                GROUP BY numero_remito, proveedores_id_proveedor
                HAVING COUNT(*) > 1
                LIMIT 1
                """
            )
            duplicate = cursor.fetchone()
            if duplicate:
                raise RuntimeError(
                    "Hay remitos duplicados para un mismo proveedor; "
                    "se requiere revisarlos antes de completar la actualización."
                )
            cursor.execute(
                """
                ALTER TABLE remitos
                ADD UNIQUE KEY uq_remito_proveedor
                    (numero_remito, proveedores_id_proveedor)
                """
            )
            LOGGER.info("Creado el índice uq_remito_proveedor.")

        if "uq_remitos_numero" in remito_indexes:
            cursor.execute("ALTER TABLE remitos DROP INDEX uq_remitos_numero")
            LOGGER.info("Eliminado el índice antiguo uq_remitos_numero.")

        planilla_indexes = _index_names(cursor, "planilla_produccion")
        if "uq_planilla_numero" in planilla_indexes:
            cursor.execute("ALTER TABLE planilla_produccion DROP INDEX uq_planilla_numero")
            LOGGER.info("Eliminado el índice antiguo uq_planilla_numero.")

        codigo_lote = _column_definition(cursor, "lote_materiales", "codigo_lote")
        if (
            codigo_lote
            and (
                codigo_lote["COLUMN_TYPE"].lower() != "varchar(50)"
                or codigo_lote["IS_NULLABLE"] != "YES"
            )
        ):
            cursor.execute(
                "ALTER TABLE lote_materiales MODIFY codigo_lote VARCHAR(50) NULL"
            )
            LOGGER.info("Actualizada la definición de lote_materiales.codigo_lote.")

        _refresh_reporting_procedures(cursor)

        conn.commit()
        LOGGER.info("Esquema de base de datos actualizado.")
    finally:
        if lock_acquired:
            cursor.execute("SELECT RELEASE_LOCK(%s)", (LOCK_NAME,))
            cursor.fetchone()
        cursor.close()
        if owns_connection:
            conn.close()
