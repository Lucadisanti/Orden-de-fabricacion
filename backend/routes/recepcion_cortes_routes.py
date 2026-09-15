from flask import Blueprint
from controllers.recepcion_cortes_controller import listar, guardar

recepcion_cortes_bp = Blueprint("recepcion_cortes", __name__)
recepcion_cortes_bp.route("/", methods=["GET"])(listar)
recepcion_cortes_bp.route("/", methods=["POST"])(guardar)
recepcion_cortes_bp.route("/<int:id_recepcion>", methods=["PUT"])(guardar)
