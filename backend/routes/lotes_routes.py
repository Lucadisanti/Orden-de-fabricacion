from flask import Blueprint
from controllers.lotes_controller import listar_lotes, obtener_lote, crear_lote, actualizar_lote, eliminar_lote

lotes_bp = Blueprint("lotes", __name__)

lotes_bp.route("/", methods=["GET"])(listar_lotes)
lotes_bp.route("/<int:id_lote>", methods=["GET"])(obtener_lote)
lotes_bp.route("/", methods=["POST"])(crear_lote)
lotes_bp.route("/<int:id_lote>", methods=["PUT"])(actualizar_lote)
lotes_bp.route("/<int:id_lote>", methods=["DELETE"])(eliminar_lote)
