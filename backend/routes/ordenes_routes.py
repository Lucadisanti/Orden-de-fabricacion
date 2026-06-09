from flask import Blueprint
from controllers.ordenes_controller import listar_ordenes, obtener_orden, crear_orden, actualizar_orden, eliminar_orden

ordenes_bp = Blueprint("ordenes", __name__)

ordenes_bp.route("/", methods=["GET"])(listar_ordenes)
ordenes_bp.route("/<int:id_orden>", methods=["GET"])(obtener_orden)
ordenes_bp.route("/", methods=["POST"])(crear_orden)
ordenes_bp.route("/<int:id_orden>", methods=["PUT"])(actualizar_orden)
ordenes_bp.route("/<int:id_orden>", methods=["DELETE"])(eliminar_orden)
