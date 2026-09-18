import pytest

from app import app


@pytest.fixture()
def client(monkeypatch):
    app.config.update(TESTING=True)
    # Las pruebas de controladores aíslan la persistencia y usan una sesión
    # administradora; la autorización por hora se prueba por separado.
    monkeypatch.setattr("app.enriquecer_respuesta", lambda response: response)

    with app.test_client() as test_client:
        with test_client.session_transaction() as sesion:
            sesion["usuario"] = {"id": 1, "usuario": "Admin", "nombre": "Administrador", "rol": "admin"}
        yield test_client
