from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_proveedores():
    return responder_lista("sp_listar_proveedores")


def obtener_proveedor(id_proveedor):
    return responder_uno("sp_obtener_proveedor", (id_proveedor,))


def crear_proveedor():
    data = request.json or {}
    return responder_accion(
        "sp_crear_proveedor",
        (
            data.get("nombre_proveedor"),
            data.get("cuit"),
            data.get("telefono"),
            data.get("email"),
        ),
        201,
    )


def actualizar_proveedor(id_proveedor):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_proveedor",
        (
            id_proveedor,
            data.get("nombre_proveedor"),
            data.get("cuit"),
            data.get("telefono"),
            data.get("email"),
        ),
    )


def eliminar_proveedor(id_proveedor):
    return responder_accion("sp_eliminar_proveedor", (id_proveedor,))
