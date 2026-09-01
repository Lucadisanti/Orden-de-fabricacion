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
