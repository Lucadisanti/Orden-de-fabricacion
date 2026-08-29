from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion
from utils.forced_deletes import eliminar_planilla as eliminar_planilla_forzada, responder_borrado_forzado, responder_borrado_simple


def listar_planillas():
    return responder_lista("sp_listar_planillas")


def obtener_planilla(id_planilla):
    return responder_uno("sp_obtener_planilla", (id_planilla,))


def crear_planilla():
    data = request.json or {}
    return responder_accion(
        "sp_crear_planilla",
        (
            data.get("orden_fabricacion_id_orden"),
            data.get("numero_planilla"),
            data.get("fecha"),
            data.get("tipo_planilla"),
            data.get("maquinas_id_maquina"),
            data.get("estado"),
        ),
        201,
    )


def actualizar_planilla(id_planilla):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_planilla",
        (
            id_planilla,
            data.get("orden_fabricacion_id_orden"),
            data.get("numero_planilla"),
            data.get("fecha"),
            data.get("tipo_planilla"),
            data.get("maquinas_id_maquina"),
            data.get("estado"),
        ),
    )


def eliminar_planilla(id_planilla):
    if request.args.get("forzar") == "1":
        return responder_borrado_forzado(eliminar_planilla_forzada, id_planilla, "planilla")
    return responder_borrado_simple("planilla_produccion", "id_planilla", id_planilla, "planilla")


def listar_detalles_planilla(id_planilla):
    return responder_lista("sp_listar_detalles_planilla", (id_planilla,))


def crear_detalle_planilla(id_planilla):
    data = request.json or {}
    return responder_accion(
        "sp_crear_detalle_planilla",
        (
            id_planilla,
            data.get("talle"),
            data.get("cantidad_pares"),
        ),
        201,
    )


def actualizar_detalle_planilla(id_detalle):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_detalle_planilla",
        (
            id_detalle,
            data.get("talle"),
            data.get("cantidad_pares"),
        ),
    )


def eliminar_detalle_planilla(id_detalle):
    return responder_accion("sp_eliminar_detalle_planilla", (id_detalle,))


def listar_operarios_planilla(id_planilla):
    return responder_lista("sp_listar_operarios_planilla", (id_planilla,))


def crear_operario_planilla(id_planilla):
    data = request.json or {}
    return responder_accion(
        "sp_crear_operario_planilla",
        (
            data.get("etapa"),
            data.get("nombre_operario"),
            id_planilla,
        ),
        201,
    )


def actualizar_operario_planilla(id_operario_planilla):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_operario_planilla",
        (
            id_operario_planilla,
            data.get("etapa"),
            data.get("nombre_operario"),
        ),
    )


def eliminar_operario_planilla(id_operario_planilla):
    return responder_accion("sp_eliminar_operario_planilla", (id_operario_planilla,))
