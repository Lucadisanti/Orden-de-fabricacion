from flask import Blueprint
from controllers.uso_materiales_controller import listar_usos_materiales, obtener_uso_material, crear_uso_material, actualizar_uso_material, eliminar_uso_material

uso_materiales_bp = Blueprint("uso_materiales", __name__)

uso_materiales_bp.route("/", methods=["GET"])(listar_usos_materiales)
uso_materiales_bp.route("/<int:id_uso>", methods=["GET"])(obtener_uso_material)
uso_materiales_bp.route("/", methods=["POST"])(crear_uso_material)
uso_materiales_bp.route("/<int:id_uso>", methods=["PUT"])(actualizar_uso_material)
uso_materiales_bp.route("/<int:id_uso>", methods=["DELETE"])(eliminar_uso_material)
