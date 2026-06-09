from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_productos():
    return responder_lista("sp_listar_productos")


def obtener_producto(id_producto):
    return responder_uno("sp_obtener_producto", (id_producto,))


def crear_producto():
    data = request.json or {}
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