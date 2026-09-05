from flask import jsonify

from db.connection import get_connection
from utils.db_helpers import responder_error_db


def _eliminar_planilla(cursor, id_planilla):
    cursor.execute("SELECT id_linea FROM produccion_diaria_linea WHERE planilla_produccion_id_planilla=%s", (id_planilla,))
    for linea in cursor.fetchall():
        cursor.execute("DELETE FROM detalle_produccion_diaria WHERE linea_id=%s", (linea["id_linea"],))
        cursor.execute("DELETE FROM produccion_diaria_linea_material WHERE linea_id=%s", (linea["id_linea"],))
        cursor.execute("DELETE FROM produccion_diaria_linea WHERE id_linea=%s", (linea["id_linea"],))
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
    cursor.execute("""
      SELECT DISTINCT pdl.id_linea,pdl.planilla_produccion_id_planilla
      FROM produccion_diaria_linea pdl
      LEFT JOIN produccion_diaria_linea_material pdlm ON pdlm.linea_id=pdl.id_linea
      WHERE pdl.lote_puntera_id=%s OR pdl.lote_pu_id=%s OR pdlm.lote_materiales_id_lote=%s
    """, (id_lote, id_lote, id_lote))
    for linea in cursor.fetchall():
        cursor.execute("SELECT talle,cantidad_pares FROM detalle_produccion_diaria WHERE linea_id=%s", (linea["id_linea"],))
        for detalle in cursor.fetchall():
            cursor.execute("""
              UPDATE detalle_planilla SET cantidad_pares=GREATEST(cantidad_pares-%s,0)
              WHERE planilla_produccion_id_planilla=%s AND talle=%s
            """, (detalle["cantidad_pares"], linea["planilla_produccion_id_planilla"], detalle["talle"]))
        cursor.execute("DELETE FROM detalle_produccion_diaria WHERE linea_id=%s", (linea["id_linea"],))
        cursor.execute("DELETE FROM produccion_diaria_linea_material WHERE linea_id=%s", (linea["id_linea"],))
        cursor.execute("DELETE FROM produccion_diaria_linea WHERE id_linea=%s", (linea["id_linea"],))
    cursor.execute("DELETE FROM uso_materiales WHERE lote_materiales_id_lote = %s", (id_lote,))
    cursor.execute("DELETE FROM lote_materiales WHERE id_lote = %s", (id_lote,))


def eliminar_remito(cursor, id_registro):
    cursor.execute("SELECT id_lote FROM lote_materiales WHERE remitos_id_remito=%s", (id_registro,))
    for lote in cursor.fetchall():
        _eliminar_lote(cursor, lote["id_lote"])
    cursor.execute("DELETE FROM remitos WHERE id_remito=%s", (id_registro,))
    return cursor.rowcount


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


def responder_borrado_simple(tabla, campo_id, id_registro, entidad):
    tablas_permitidas = {
        "proveedores": "id_proveedor",
        "materiales": "id_material",
        "producto": "id_producto",
        "orden_fabricacion": "id_orden",
        "planilla_produccion": "id_planilla",
    }
    if tablas_permitidas.get(tabla) != campo_id:
        return jsonify({"mensaje": "Operación de eliminación no permitida"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {tabla} WHERE {campo_id} = %s", (id_registro,))
        if not cursor.rowcount:
            conn.rollback()
            return jsonify({"mensaje": f"{entidad.capitalize()} no encontrado"}), 404
        conn.commit()
        return jsonify({"mensaje": f"{entidad.capitalize()} eliminado correctamente"}), 200
    except Exception as error:
        if conn:
            conn.rollback()
        return responder_error_db(error)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
