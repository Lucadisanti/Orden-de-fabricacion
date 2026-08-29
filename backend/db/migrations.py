import logging

from db.connection import get_connection


LOGGER = logging.getLogger(__name__)
LOCK_NAME = "orden_fabricacion_schema_migrations"


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

        conn.commit()
        LOGGER.info("Esquema de base de datos actualizado.")
    finally:
        if lock_acquired:
            cursor.execute("SELECT RELEASE_LOCK(%s)", (LOCK_NAME,))
            cursor.fetchone()
        cursor.close()
        if owns_connection:
            conn.close()
