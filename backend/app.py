from flask import Flask
from flask_cors import CORS
import os

from routes.productos_routes import productos_bp
from routes.colores_routes import colores_bp
from routes.materiales_routes import materiales_bp
from routes.proveedores_routes import proveedores_bp
from routes.maquinas_routes import maquinas_bp
from routes.ordenes_routes import ordenes_bp
from routes.remitos_routes import remitos_bp
from routes.lotes_routes import lotes_bp
from routes.planillas_routes import planillas_bp
from routes.uso_materiales_routes import uso_materiales_bp
from routes.trazabilidad_routes import trazabilidad_bp
from routes.dashboard_routes import dashboard_bp

app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173").split(","))

app.register_blueprint(productos_bp, url_prefix="/api/productos")
app.register_blueprint(colores_bp, url_prefix="/api/colores")
app.register_blueprint(materiales_bp, url_prefix="/api/materiales")
app.register_blueprint(proveedores_bp, url_prefix="/api/proveedores")
app.register_blueprint(maquinas_bp, url_prefix="/api/maquinas")
app.register_blueprint(ordenes_bp, url_prefix="/api/ordenes")
app.register_blueprint(remitos_bp, url_prefix="/api/remitos")
app.register_blueprint(lotes_bp, url_prefix="/api/lotes")
app.register_blueprint(planillas_bp, url_prefix="/api/planillas")
app.register_blueprint(uso_materiales_bp, url_prefix="/api/uso-materiales")
app.register_blueprint(trazabilidad_bp, url_prefix="/api/trazabilidad")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")


@app.route("/")
def home():
    return {
        "mensaje": "Backend funcionando correctamente",
        "endpoints": [
            "/api/productos/",
            "/api/colores/",
            "/api/materiales/",
            "/api/proveedores/",
            "/api/maquinas/",
            "/api/ordenes/",
            "/api/remitos/",
            "/api/lotes/",
            "/api/planillas/",
            "/api/uso-materiales/",
            "/api/trazabilidad/lote/<codigo_lote>",
            "/api/dashboard/resumen",
        ],
    }


if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
    )
