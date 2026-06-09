from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_usos_materiales():
    return responder_lista("sp_listar_usos_materiales")


def obtener_uso_material(id_uso):
    return responder_uno("sp_obtener_uso_material", (id_uso,))


def crear_uso_material():
    data = request.json or {}
    return responder_accion(
        "sp_crear_uso_material",
        (
            data.get("lote_materiales_id_lote"),
            data.get("planilla_produccion_id_planilla"),
            data.get("cantidad_usada"),
        ),
        201,
    )


def actualizar_uso_material(id_uso):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_uso_material",
        (
            id_uso,
            data.get("lote_materiales_id_lote"),
            data.get("planilla_produccion_id_planilla"),
            data.get("cantidad_usada"),
        ),
    )


def eliminar_uso_material(id_uso):
    return responder_accion("sp_eliminar_uso_material", (id_uso,))
