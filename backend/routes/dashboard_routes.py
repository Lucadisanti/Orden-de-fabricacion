from flask import Blueprint
from controllers.dashboard_controller import resumen_dashboard

dashboard_bp = Blueprint("dashboard", __name__)

dashboard_bp.route("/resumen", methods=["GET"])(resumen_dashboard)
