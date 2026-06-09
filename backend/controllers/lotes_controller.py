from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_lotes():
    return responder_lista("sp_listar_lotes")


def obtener_lote(id_lote):
    return responder_uno("sp_obtener_lote", (id_lote,))


def crear_lote():
    data = request.json or {}
    return responder_accion(
        "sp_crear_lote",
        (
            data.get("remitos_id_remito"),
            data.get("materiales_id_material"),
            data.get("colores_id_color"),
            data.get("codigo_lote"),
            data.get("cantidad_solicitada"),
            data.get("cantidad_recibida"),
            data.get("pendiente"),
            data.get("observaciones"),
        ),
        201,
    )


def actualizar_lote(id_lote):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_lote",
        (
            id_lote,
            data.get("remitos_id_remito"),
            data.get("materiales_id_material"),
            data.get("colores_id_color"),
            data.get("codigo_lote"),
            data.get("cantidad_solicitada"),
            data.get("cantidad_recibida"),
            data.get("pendiente"),
            data.get("observaciones"),
        ),
    )


def eliminar_lote(id_lote):
    return responder_accion("sp_eliminar_lote", (id_lote,))
