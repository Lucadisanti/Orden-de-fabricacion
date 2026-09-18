import os
from flask import Flask, jsonify, request, session
from flask_cors import CORS

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
from routes.catalogos_routes import catalogos_bp
from routes.produccion_diaria_routes import produccion_diaria_bp

from routes.recepcion_cortes_routes import recepcion_cortes_bp

from routes.sugerencias_routes import sugerencias_bp
from routes.auth_routes import auth_bp
from controllers.auth_controller import configurar_admin
from utils.registro_permisos import autorizar_cambio, enriquecer_respuesta

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "bohm-cambiar-esta-clave-en-produccion")
CORS(app, supports_credentials=True)
configurar_admin()
@app.before_request
def proteger_api():
    if request.method == "OPTIONS" or not request.path.startswith("/api/") or request.path in {"/api/auth/login", "/api/auth/me", "/api/auth/logout", "/api/auth/recuperar"}: return None
    if not session.get("usuario"): return jsonify({"error":"Sesión requerida."}),401
    if request.path.startswith("/api/auth/usuarios") and session["usuario"]["rol"] not in {"maestro", "admin"}: return jsonify({"error":"Solo un administrador puede gestionar usuarios."}),403
    if request.method in {"PUT", "PATCH", "DELETE"} or (request.method == "POST" and request.path.startswith("/api/planillas/") and request.path.rstrip("/") != "/api/planillas"):
        return autorizar_cambio()

@app.after_request
def registrar_y_mostrar_autoria(response):
    if request.path.startswith("/api/") and session.get("usuario"):
        return enriquecer_respuesta(response)
    return response
app.register_blueprint(sugerencias_bp, url_prefix="/api/sugerencias")
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(recepcion_cortes_bp, url_prefix="/api/recepcion-cortes")

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
app.register_blueprint(catalogos_bp, url_prefix="/api/catalogos")
app.register_blueprint(produccion_diaria_bp, url_prefix="/api/produccion-diaria")


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
    app.run(debug=True)
