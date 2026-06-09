from flask import Blueprint
from controllers.productos_controller import listar_productos, obtener_producto, crear_producto, actualizar_producto, eliminar_producto

productos_bp = Blueprint("productos", __name__)

productos_bp.route("/", methods=["GET"])(listar_productos)
productos_bp.route("/<int:id_producto>", methods=["GET"])(obtener_producto)
productos_bp.route("/", methods=["POST"])(crear_producto)
productos_bp.route("/<int:id_producto>", methods=["PUT"])(actualizar_producto)
productos_bp.route("/<int:id_producto>", methods=["DELETE"])(eliminar_producto)
