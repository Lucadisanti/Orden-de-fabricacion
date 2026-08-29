from flask import jsonify

from db.connection import get_connection
from utils.db_helpers import responder_error_db


def _eliminar_planilla(cursor, id_planilla):
    cursor.execute("DELETE FROM uso_materiales WHERE planilla_produccion_id_planilla = %s", (id_planilla,))
    cursor.execute("DELETE FROM detalle_planilla WHERE planilla_produccion_id_planilla = %s", (id_planilla,))
    cursor.execute("DELETE FROM operarios_planilla WHERE planilla_produccion_id_planilla = %s", (id_planilla,))
    cursor.execute("DELETE FROM planilla_produccion WHERE id_planilla = %s", (id_planilla,))
    return cursor.rowcount


def _eliminar_orden(cursor, id_orden):
    cursor.execute("SELECT id_planilla FROM planilla_produccion WHERE orden_fabricacion_id_orden = %s", (id_orden,))
    for fila in cursor.fetchall():
        _eliminar_planilla(cursor, fila["id_planilla"])
    cursor.execute("DELETE FROM detalle_orden WHERE orden_fabricacion_id_orden = %s", (id_orden,))
    cursor.execute("DELETE FROM orden_fabricacion WHERE id_orden = %s", (id_orden,))
    return cursor.rowcount


def _eliminar_lote(cursor, id_lote):
    cursor.execute("DELETE FROM uso_materiales WHERE lote_materiales_id_lote = %s", (id_lote,))
    cursor.execute("DELETE FROM lote_materiales WHERE id_lote = %s", (id_lote,))


def eliminar_planilla(cursor, id_registro):
    return _eliminar_planilla(cursor, id_registro)


def eliminar_orden(cursor, id_registro):
    return _eliminar_orden(cursor, id_registro)


def eliminar_producto(cursor, id_registro):
    cursor.execute("SELECT id_orden FROM orden_fabricacion WHERE producto_id_producto = %s", (id_registro,))
    for fila in cursor.fetchall():
        _eliminar_orden(cursor, fila["id_orden"])
    cursor.execute("DELETE FROM producto_adicionales WHERE producto_id_producto = %s", (id_registro,))
    cursor.execute("DELETE FROM producto WHERE id_producto = %s", (id_registro,))
    return cursor.rowcount


def eliminar_proveedor(cursor, id_registro):
    cursor.execute("SELECT id_remito FROM remitos WHERE proveedores_id_proveedor = %s", (id_registro,))
    remitos = [fila["id_remito"] for fila in cursor.fetchall()]
    for id_remito in remitos:
        cursor.execute("SELECT id_lote FROM lote_materiales WHERE remitos_id_remito = %s", (id_remito,))
        for lote in cursor.fetchall():
            _eliminar_lote(cursor, lote["id_lote"])
        cursor.execute("DELETE FROM remitos WHERE id_remito = %s", (id_remito,))
    cursor.execute("DELETE FROM proveedores WHERE id_proveedor = %s", (id_registro,))
    return cursor.rowcount


def eliminar_material(cursor, id_registro):
    cursor.execute("SELECT id_lote FROM lote_materiales WHERE materiales_id_material = %s", (id_registro,))
    for fila in cursor.fetchall():
        _eliminar_lote(cursor, fila["id_lote"])
    cursor.execute("DELETE FROM materiales WHERE id_material = %s", (id_registro,))
    return cursor.rowcount


def responder_borrado_forzado(eliminador, id_registro, entidad):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        eliminado = eliminador(cursor, id_registro)
        if not eliminado:
            conn.rollback()
            return jsonify({"mensaje": f"{entidad.capitalize()} no encontrado"}), 404
        conn.commit()
        return jsonify({"mensaje": f"{entidad.capitalize()} y sus registros relacionados fueron eliminados"}), 200
    except Exception as error:
        if conn:
            conn.rollback()
        return responder_error_db(error)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
