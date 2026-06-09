from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def listar_maquinas():
    return responder_lista("sp_listar_maquinas")


def obtener_maquina(id_maquina):
    return responder_uno("sp_obtener_maquina", (id_maquina,))


def crear_maquina():
    data = request.json or {}
    return responder_accion("sp_crear_maquina", (data.get("nombre_maquina"),), 201)


def actualizar_maquina(id_maquina):
    data = request.json or {}
    return responder_accion("sp_actualizar_maquina", (id_maquina, data.get("nombre_maquina")))


def eliminar_maquina(id_maquina):
    return responder_accion("sp_eliminar_maquina", (id_maquina,))
