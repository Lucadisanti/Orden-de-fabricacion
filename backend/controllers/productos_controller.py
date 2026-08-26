from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def validar_producto(data):
    campos_obligatorios = (
        "articulo_producto",
        "nombre_producto",
        "colores_id_color",
    )

    if any(data.get(campo) in (None, "") for campo in campos_obligatorios):
        return "Todos los campos del producto son obligatorios"

    if not str(data["articulo_producto"]).strip() or not str(data["nombre_producto"]).strip():
        return "Articulo y nombre no pueden estar vacios"

    try:
        if int(data["colores_id_color"]) <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return "El color seleccionado no es valido"

    return None


def listar_productos():
    return responder_lista("sp_listar_productos")


def obtener_producto(id_producto):
    return responder_uno("sp_obtener_producto", (id_producto,))


def crear_producto():
    data = request.json or {}
    error = validar_producto(data)
    if error:
        return {"mensaje": error}, 400

    return responder_accion(
        "sp_crear_producto",
        (
            data.get("articulo_producto"),
            data.get("nombre_producto"),
            data.get("colores_id_color"),
        ),
        201,
    )


def actualizar_producto(id_producto):
    data = request.json or {}
    error = validar_producto(data)
    if error:
        return {"mensaje": error}, 400

    return responder_accion(
        "sp_actualizar_producto",
        (
            id_producto,
            data.get("articulo_producto"),
            data.get("nombre_producto"),
            data.get("colores_id_color"),
        ),
    )


def eliminar_producto(id_producto):
    return responder_accion("sp_eliminar_producto", (id_producto,))
