from flask import Blueprint

from controllers.produccion_diaria_controller import actualizar_linea_produccion, crear_produccion_diaria, desglose_por_planilla, detalle_linea_produccion, listar_disponibilidad_ordenes, listar_distribucion_planillas, listar_producciones_diarias


produccion_diaria_bp = Blueprint("produccion_diaria", __name__)

produccion_diaria_bp.route("/", methods=["GET"])(listar_producciones_diarias)
produccion_diaria_bp.route("/", methods=["POST"])(crear_produccion_diaria)
produccion_diaria_bp.route("/disponibilidad", methods=["GET"])(listar_disponibilidad_ordenes)
produccion_diaria_bp.route("/distribucion-planillas", methods=["GET"])(listar_distribucion_planillas)
produccion_diaria_bp.route("/planilla/<int:id_planilla>/desglose", methods=["GET"])(desglose_por_planilla)
produccion_diaria_bp.route("/linea/<int:id_linea>/detalle", methods=["GET"])(detalle_linea_produccion)
produccion_diaria_bp.route("/linea/<int:id_linea>", methods=["PUT"])(actualizar_linea_produccion)
