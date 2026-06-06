from flask import Flask
from flask_cors import CORS

from routes.productos_routes import productos_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(productos_bp, url_prefix="/api/productos")

@app.route("/")
def home():
    return {
        "mensaje": "Backend funcionando correctamente"
    }

if __name__ == "__main__":
    app.run(debug=True)