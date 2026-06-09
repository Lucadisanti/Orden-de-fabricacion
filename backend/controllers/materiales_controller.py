from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_materiales():
    return responder_lista("sp_listar_materiales")


def obtener_material(id_material):
    return responder_uno("sp_obtener_material", (id_material,))


def crear_material():
    data = request.json or {}
    return responder_accion("sp_crear_material", (data.get("material"),), 201)


def actualizar_material(id_material):
    data = request.json or {}
    return responder_accion("sp_actualizar_material", (id_material, data.get("material")))


def eliminar_material(id_material):
    return responder_accion("sp_eliminar_material", (id_material,))
