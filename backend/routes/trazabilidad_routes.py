from flask import Blueprint
from controllers.trazabilidad_controller import trazabilidad_por_lote, ordenes_afectadas_por_lote, materiales_por_orden

trazabilidad_bp = Blueprint("trazabilidad", __name__)

trazabilidad_bp.route("/lote/<string:codigo_lote>", methods=["GET"])(trazabilidad_por_lote)
trazabilidad_bp.route("/lote-id/<int:id_lote>/ordenes", methods=["GET"])(ordenes_afectadas_por_lote)
trazabilidad_bp.route("/orden/<int:id_orden>/materiales", methods=["GET"])(materiales_por_orden)
