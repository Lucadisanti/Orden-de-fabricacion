import os
import secrets
from unittest.mock import patch

import mysql.connector
import pytest


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

    with app.test_client() as test_client:
        with test_client.session_transaction() as sesion:
            sesion["usuario"] = {"id": 1, "usuario": "Admin", "nombre": "Administrador", "rol": "admin"}
        yield test_client
