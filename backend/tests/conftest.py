import os
import secrets
from unittest.mock import MagicMock, patch

import mysql.connector
import pytest
from flask import session


def impedir_conexion_real(*args, **kwargs):
    raise RuntimeError("Las pruebas no permiten conexiones reales a MySQL; usá un mock.")


# app inicializa cuentas al importarse fuera de TESTING. El bloqueo también
# protege esa importación si en el futuro aparece otro acceso a la base.
os.environ["TESTING"] = "1"
os.environ["ORDEN_ENV"] = "testing"
os.environ["FLASK_SECRET_KEY"] = secrets.token_hex(32)
with patch.object(mysql.connector, "connect", side_effect=impedir_conexion_real):
    from app import app


@pytest.fixture(autouse=True)
def bloquear_mysql_real(monkeypatch):
    monkeypatch.setattr(mysql.connector, "connect", impedir_conexion_real)


@pytest.fixture()
def client(monkeypatch):
    app.config.update(TESTING=True)
    # Las pruebas de controladores aíslan la persistencia y usan una sesión
    # administradora; la autorización por hora se prueba por separado.
    monkeypatch.setattr("app.enriquecer_respuesta", lambda response: response)

    # Persistencia simulada para los actores de los tests de negocio. La
    # revalidación sigue activa; sus regresiones usan un almacén independiente.
    from utils import session_security
    password_hash = "hash-ficticio-de-los-tests-de-negocio"
    cursor = MagicMock()
    cursor.fetchone.side_effect = lambda: {
        "id_usuario": session["usuario"]["id"], "usuario": session["usuario"].get("usuario", "Prueba"),
        "nombre": session["usuario"]["nombre"], "rol": session["usuario"]["rol"],
        "activo": 1, "password_hash": password_hash,
    }
    conexion = MagicMock()
    conexion.cursor.return_value = cursor
    monkeypatch.setattr(session_security, "get_connection", lambda: conexion)
    with app.app_context():
        huella = session_security.huella_credencial(password_hash)

    with app.test_client() as test_client:
        with test_client.session_transaction() as sesion:
            sesion["usuario"] = {"id": 1, "usuario": "Admin", "nombre": "Administrador", "rol": "admin"}
            sesion["_credencial"] = huella
        yield test_client
