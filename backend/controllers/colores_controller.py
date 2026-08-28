from flask import jsonify, request
from db.connection import get_connection
from utils.db_helpers import responder_lista, responder_uno, responder_accion
from utils.product_codes import recalcular_articulos


def listar_colores():
    return responder_lista("sp_listar_colores")


def obtener_color(id_color):
    return responder_uno("sp_obtener_color", (id_color,))


def crear_color():
    data = request.json or {}
    return responder_accion("sp_crear_color", (data.get("color"), data.get("codigo_color")), 201)


def actualizar_color(id_color):
    data = request.json or {}
    codigo = str(data.get("codigo_color") or "").strip()
    color = str(data.get("color") or "").strip()
    if not codigo.isdigit() or len(codigo) != 2 or not color:
        return jsonify({"mensaje": "El codigo debe tener 2 digitos y la descripcion es obligatoria"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE colores SET color = %s, codigo_color = %s WHERE id_color = %s", (color, codigo, id_color))
        recalcular_articulos(cursor)
        conn.commit()
        return jsonify({"id_color": id_color, "color": color, "codigo_color": codigo}), 200
    except Exception as error:
        if conn:
            conn.rollback()
        mensaje = "Ya existe un color con ese codigo" if "Duplicate entry" in str(error) else "No se pudo actualizar el color"
        return jsonify({"mensaje": mensaje}), 409 if "Duplicate entry" in str(error) else 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def eliminar_color(id_color):
    return responder_accion("sp_eliminar_color", (id_color,))
