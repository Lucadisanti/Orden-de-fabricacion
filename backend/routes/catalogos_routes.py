from flask import Blueprint
from controllers.catalogos_controller import actualizar_adicional, actualizar_modelo_calzado, actualizar_puntera, crear_adicional, crear_modelo_calzado, crear_puntera, listar_adicionales, listar_modelos_calzado, listar_punteras


catalogos_bp = Blueprint("catalogos", __name__)

catalogos_bp.route("/modelos-calzado", methods=["GET"])(listar_modelos_calzado)
catalogos_bp.route("/modelos-calzado", methods=["POST"])(crear_modelo_calzado)
catalogos_bp.route("/modelos-calzado/<int:id_modelo>", methods=["PUT"])(actualizar_modelo_calzado)
catalogos_bp.route("/punteras", methods=["GET"])(listar_punteras)
catalogos_bp.route("/punteras", methods=["POST"])(crear_puntera)
catalogos_bp.route("/punteras/<int:id_puntera>", methods=["PUT"])(actualizar_puntera)
catalogos_bp.route("/adicionales", methods=["GET"])(listar_adicionales)
catalogos_bp.route("/adicionales", methods=["POST"])(crear_adicional)
catalogos_bp.route("/adicionales/<int:id_adicional>", methods=["PUT"])(actualizar_adicional)
