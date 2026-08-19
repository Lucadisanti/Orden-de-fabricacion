from flask import jsonify, request
from db.connection import get_connection
from utils.db_helpers import responder_lista, responder_uno, responder_accion


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


def listar_ordenes():
    return responder_lista("sp_listar_ordenes")


def obtener_orden(id_orden):
    return responder_uno("sp_obtener_orden", (id_orden,))


def crear_orden():
    data = request.json or {}
    talles = _normalizar_talles(data.get("talles"))

    if not talles:
        return jsonify({"error": "Debe cargar al menos un talle con cantidad."}), 400

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
        conn.commit()
        return jsonify({"id_orden": id_orden, "mensaje": "Orden creada correctamente"}), 201
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

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()
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
    return responder_accion("sp_eliminar_orden", (id_orden,))
