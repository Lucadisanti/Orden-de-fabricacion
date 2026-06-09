from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_ordenes():
    return responder_lista("sp_listar_ordenes")


def obtener_orden(id_orden):
    return responder_uno("sp_obtener_orden", (id_orden,))


def crear_orden():
    data = request.json or {}
    return responder_accion(
        "sp_crear_orden",
        (
            data.get("producto_id_producto"),
            data.get("numero_orden"),
            data.get("fecha"),
        ),
        201,
    )


def actualizar_orden(id_orden):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_orden",
        (
            id_orden,
            data.get("producto_id_producto"),
            data.get("numero_orden"),
            data.get("fecha"),
        ),
    )


def eliminar_orden(id_orden):
    return responder_accion("sp_eliminar_orden", (id_orden,))
