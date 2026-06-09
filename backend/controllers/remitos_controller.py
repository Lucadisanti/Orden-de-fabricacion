from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_remitos():
    return responder_lista("sp_listar_remitos")


def obtener_remito(id_remito):
    return responder_uno("sp_obtener_remito", (id_remito,))


def crear_remito():
    data = request.json or {}
    return responder_accion(
        "sp_crear_remito",
        (
            data.get("numero_remito"),
            data.get("fecha_solicitud"),
            data.get("fecha_entrega"),
            data.get("estado_recepcion"),
            data.get("recibido_por"),
            data.get("proveedores_id_proveedor"),
        ),
        201,
    )


def actualizar_remito(id_remito):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_remito",
        (
            id_remito,
            data.get("numero_remito"),
            data.get("fecha_solicitud"),
            data.get("fecha_entrega"),
            data.get("estado_recepcion"),
            data.get("recibido_por"),
            data.get("proveedores_id_proveedor"),
        ),
    )


def eliminar_remito(id_remito):
    return responder_accion("sp_eliminar_remito", (id_remito,))
