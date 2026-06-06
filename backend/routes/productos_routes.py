from flask import Blueprint
from controllers.productos_controller import listar_productos, crear_producto

productos_bp = Blueprint("productos", __name__)

productos_bp.route("/", methods=["GET"])(listar_productos)
productos_bp.route("/", methods=["POST"])(crear_producto)