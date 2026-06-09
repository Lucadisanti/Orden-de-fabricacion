from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_colores():
    return responder_lista("sp_listar_colores")


def obtener_color(id_color):
    return responder_uno("sp_obtener_color", (id_color,))


def crear_color():
    data = request.json or {}
    return responder_accion("sp_crear_color", (data.get("color"),), 201)


def actualizar_color(id_color):
    data = request.json or {}
    return responder_accion("sp_actualizar_color", (id_color, data.get("color")))


def eliminar_color(id_color):
    return responder_accion("sp_eliminar_color", (id_color,))
