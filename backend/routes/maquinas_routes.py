from flask import Blueprint
from controllers.maquinas_controller import listar_maquinas, obtener_maquina, crear_maquina, actualizar_maquina, eliminar_maquina

maquinas_bp = Blueprint("maquinas", __name__)

maquinas_bp.route("/", methods=["GET"])(listar_maquinas)
maquinas_bp.route("/<int:id_maquina>", methods=["GET"])(obtener_maquina)
maquinas_bp.route("/", methods=["POST"])(crear_maquina)
maquinas_bp.route("/<int:id_maquina>", methods=["PUT"])(actualizar_maquina)
maquinas_bp.route("/<int:id_maquina>", methods=["DELETE"])(eliminar_maquina)
