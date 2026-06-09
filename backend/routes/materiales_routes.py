from flask import Blueprint
from controllers.materiales_controller import listar_materiales, obtener_material, crear_material, actualizar_material, eliminar_material

materiales_bp = Blueprint("materiales", __name__)

materiales_bp.route("/", methods=["GET"])(listar_materiales)
materiales_bp.route("/<int:id_material>", methods=["GET"])(obtener_material)
materiales_bp.route("/", methods=["POST"])(crear_material)
materiales_bp.route("/<int:id_material>", methods=["PUT"])(actualizar_material)
materiales_bp.route("/<int:id_material>", methods=["DELETE"])(eliminar_material)
