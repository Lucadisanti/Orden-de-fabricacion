from flask import Blueprint
from controllers.proveedores_controller import listar_proveedores, obtener_proveedor, crear_proveedor, actualizar_proveedor, eliminar_proveedor

proveedores_bp = Blueprint("proveedores", __name__)

proveedores_bp.route("/", methods=["GET"])(listar_proveedores)
proveedores_bp.route("/<int:id_proveedor>", methods=["GET"])(obtener_proveedor)
proveedores_bp.route("/", methods=["POST"])(crear_proveedor)
proveedores_bp.route("/<int:id_proveedor>", methods=["PUT"])(actualizar_proveedor)
proveedores_bp.route("/<int:id_proveedor>", methods=["DELETE"])(eliminar_proveedor)
