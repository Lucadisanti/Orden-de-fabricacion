from flask import Blueprint
from controllers.planillas_controller import (
    listar_planillas,
    obtener_planilla,
    crear_planilla,
    actualizar_planilla,
    eliminar_planilla,
    listar_detalles_planilla,
    crear_detalle_planilla,
    actualizar_detalle_planilla,
    eliminar_detalle_planilla,
    listar_operarios_planilla,
    crear_operario_planilla,
    actualizar_operario_planilla,
    eliminar_operario_planilla,
)

planillas_bp = Blueprint("planillas", __name__)

planillas_bp.route("/", methods=["GET"])(listar_planillas)
planillas_bp.route("/<int:id_planilla>", methods=["GET"])(obtener_planilla)
planillas_bp.route("/", methods=["POST"])(crear_planilla)
planillas_bp.route("/<int:id_planilla>", methods=["PUT"])(actualizar_planilla)
planillas_bp.route("/<int:id_planilla>", methods=["DELETE"])(eliminar_planilla)

planillas_bp.route("/<int:id_planilla>/detalles", methods=["GET"])(listar_detalles_planilla)
planillas_bp.route("/<int:id_planilla>/detalles", methods=["POST"])(crear_detalle_planilla)
planillas_bp.route("/detalles/<int:id_detalle>", methods=["PUT"])(actualizar_detalle_planilla)
planillas_bp.route("/detalles/<int:id_detalle>", methods=["DELETE"])(eliminar_detalle_planilla)

planillas_bp.route("/<int:id_planilla>/operarios", methods=["GET"])(listar_operarios_planilla)
planillas_bp.route("/<int:id_planilla>/operarios", methods=["POST"])(crear_operario_planilla)
planillas_bp.route("/operarios/<int:id_operario_planilla>", methods=["PUT"])(actualizar_operario_planilla)
planillas_bp.route("/operarios/<int:id_operario_planilla>", methods=["DELETE"])(eliminar_operario_planilla)
