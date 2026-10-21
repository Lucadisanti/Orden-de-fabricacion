from unittest.mock import MagicMock

from controllers import auth_controller


def comprobar_cabeceras(response):
    assert response.headers["Cache-Control"] == "no-store"
    assert response.headers["X-Content-Type-Options"] == "nosniff"


def test_identidad_autenticada_no_se_puede_almacenar_en_cache(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json["id"] == 1
    comprobar_cabeceras(response)


def test_error_de_sesion_conserva_estado_y_no_se_almacena(client):
    with client.session_transaction() as sesion:
        sesion.clear()

    response = client.get("/api/productos/")

    assert response.status_code == 401
    assert response.json == {"error": "Sesión requerida."}
    comprobar_cabeceras(response)


def test_cierre_de_sesion_conserva_respuesta_sin_contenido(client):
    response = client.post("/api/auth/logout")

    assert response.status_code == 204
    assert response.data == b""
    comprobar_cabeceras(response)
    assert client.get("/api/auth/me").status_code == 401


def test_codigo_de_recuperacion_no_se_almacena_en_cache(client, monkeypatch):
    with client.session_transaction() as sesion:
        sesion["usuario"] = {**sesion["usuario"], "rol": "maestro"}
    cursor = MagicMock()
    cursor.fetchone.return_value = {"usuario": "Cuenta de prueba"}
    conexion = MagicMock()
    conexion.cursor.return_value = cursor
    monkeypatch.setattr(auth_controller, "get_connection", lambda: conexion)

    response = client.post("/api/auth/usuarios/7/recuperacion")

    assert response.status_code == 200
    assert response.json["codigo"]
    comprobar_cabeceras(response)
    conexion.commit.assert_called_once()


def test_error_controlado_de_base_no_se_almacena(client, monkeypatch):
    monkeypatch.setattr("utils.db_helpers.ejecutar_sp", lambda *args: (None, "Error simulado"))

    response = client.get("/api/productos/999")

    assert response.status_code == 500
    assert response.json == {"mensaje": "Ocurrió un error al procesar la solicitud."}
    comprobar_cabeceras(response)


def test_rutas_fuera_de_api_conservan_sus_cabeceras(client):
    response = client.get("/")

    assert response.status_code == 200
    assert "Cache-Control" not in response.headers
