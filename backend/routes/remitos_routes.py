from flask import Blueprint
from controllers.remitos_controller import listar_remitos, obtener_remito, crear_remito, actualizar_remito, eliminar_remito

remitos_bp = Blueprint("remitos", __name__)

remitos_bp.route("/", methods=["GET"])(listar_remitos)
remitos_bp.route("/<int:id_remito>", methods=["GET"])(obtener_remito)
remitos_bp.route("/", methods=["POST"])(crear_remito)
remitos_bp.route("/<int:id_remito>", methods=["PUT"])(actualizar_remito)
remitos_bp.route("/<int:id_remito>", methods=["DELETE"])(eliminar_remito)
