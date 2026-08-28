from flask import jsonify, request
from db.connection import get_connection
from utils.db_helpers import responder_lista
from utils.product_codes import recalcular_articulos


def _crear_catalogo(tabla, columna_id, columna_codigo, columna_nombre, largo_codigo):
    data = request.json or {}
    codigo = str(data.get(columna_codigo) or "").strip()
    nombre = str(data.get(columna_nombre) or "").strip()
    if not codigo.isdigit() or len(codigo) != largo_codigo or not nombre:
        return jsonify({"mensaje": f"El codigo debe tener {largo_codigo} digitos y la descripcion es obligatoria"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            f"INSERT INTO {tabla} ({columna_codigo}, {columna_nombre}) VALUES (%s, %s)",
            (codigo, nombre),
        )
        nuevo_id = cursor.lastrowid
        conn.commit()
        return jsonify({columna_id: nuevo_id, columna_codigo: codigo, columna_nombre: nombre}), 201
    except Exception as error:
        if conn:
            conn.rollback()
        mensaje = "Ya existe una opcion con ese codigo" if "Duplicate entry" in str(error) else "No se pudo crear la opcion"
        return jsonify({"mensaje": mensaje}), 409 if "Duplicate entry" in str(error) else 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def _actualizar_catalogo(tabla, columna_id, columna_codigo, columna_nombre, largo_codigo, item_id):
    data = request.json or {}
    codigo = str(data.get(columna_codigo) or "").strip()
    nombre = str(data.get(columna_nombre) or "").strip()
    if not codigo.isdigit() or len(codigo) != largo_codigo or not nombre:
        return jsonify({"mensaje": f"El codigo debe tener {largo_codigo} digitos y la descripcion es obligatoria"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE {tabla} SET {columna_codigo} = %s, {columna_nombre} = %s WHERE {columna_id} = %s",
            (codigo, nombre, item_id),
        )
        if tabla == "modelos_calzado":
            cursor.execute(
                "UPDATE producto SET nombre_producto = %s WHERE modelos_calzado_id_modelo = %s",
                (nombre, item_id),
            )
        recalcular_articulos(cursor)
        conn.commit()
        return jsonify({columna_id: item_id, columna_codigo: codigo, columna_nombre: nombre}), 200
    except Exception as error:
        if conn:
            conn.rollback()
        mensaje = "Ya existe una opcion con ese codigo" if "Duplicate entry" in str(error) else "No se pudo actualizar la opcion"
        return jsonify({"mensaje": mensaje}), 409 if "Duplicate entry" in str(error) else 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def listar_modelos_calzado():
    return responder_lista("sp_listar_modelos_calzado")


def listar_punteras():
    return responder_lista("sp_listar_punteras")


def listar_adicionales():
    return responder_lista("sp_listar_adicionales")


def crear_modelo_calzado():
    return _crear_catalogo("modelos_calzado", "id_modelo", "codigo_modelo", "nombre_modelo", 3)


def crear_puntera():
    return _crear_catalogo("punteras", "id_puntera", "codigo_puntera", "nombre_puntera", 2)


def crear_adicional():
    return _crear_catalogo("adicionales", "id_adicional", "codigo_adicional", "nombre_adicional", 2)


def actualizar_modelo_calzado(id_modelo):
    return _actualizar_catalogo("modelos_calzado", "id_modelo", "codigo_modelo", "nombre_modelo", 3, id_modelo)


def actualizar_puntera(id_puntera):
    return _actualizar_catalogo("punteras", "id_puntera", "codigo_puntera", "nombre_puntera", 2, id_puntera)


def actualizar_adicional(id_adicional):
    return _actualizar_catalogo("adicionales", "id_adicional", "codigo_adicional", "nombre_adicional", 2, id_adicional)
