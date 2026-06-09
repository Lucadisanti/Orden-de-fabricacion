from flask import Blueprint
from controllers.colores_controller import listar_colores, obtener_color, crear_color, actualizar_color, eliminar_color

colores_bp = Blueprint("colores", __name__)

colores_bp.route("/", methods=["GET"])(listar_colores)
colores_bp.route("/<int:id_color>", methods=["GET"])(obtener_color)
colores_bp.route("/", methods=["POST"])(crear_color)
colores_bp.route("/<int:id_color>", methods=["PUT"])(actualizar_color)
colores_bp.route("/<int:id_color>", methods=["DELETE"])(eliminar_color)
