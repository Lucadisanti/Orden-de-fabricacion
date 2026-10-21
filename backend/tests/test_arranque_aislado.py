"""Comprueba el punto de entrada sin sockets, bootstrap ni conexiones reales."""

import runpy
import secrets
from unittest.mock import Mock

from flask import Flask
import pytest

from controllers import auth_controller


@pytest.fixture()
def arranque(monkeypatch):
    for variable in ("FLASK_SECRET_KEY", "ORDEN_ENV", "TESTING", "FLASK_HOST", "FLASK_PORT", "FLASK_DEBUG"):
        monkeypatch.delenv(variable, raising=False)
    bootstrap, servidor = Mock(), Mock()
    monkeypatch.setattr(auth_controller, "configurar_admin", bootstrap)
    monkeypatch.setattr(Flask, "run", servidor)
    return bootstrap, servidor


@pytest.mark.parametrize("entorno", ["development", "production"])
def test_punto_de_entrada_configurado_sin_iniciar_servicios(arranque, monkeypatch, entorno):
    bootstrap, servidor = arranque
    monkeypatch.setenv("ORDEN_ENV", entorno)
    clave = secrets.token_hex(32) if entorno == "production" else None
    if clave:
        monkeypatch.setenv("FLASK_SECRET_KEY", clave)

    modulo = runpy.run_module("app", run_name="__main__")
    aplicacion = modulo["app"]

    assert aplicacion.secret_key
    if clave:
        assert aplicacion.secret_key == clave
    bootstrap.assert_called_once_with()
    servidor.assert_called_once_with(host="127.0.0.1", port=5000, debug=False)
    assert aplicacion.test_client().get("/").status_code == 200


@pytest.mark.parametrize("clave", [None, "corta"])
def test_produccion_invalida_falla_antes_del_bootstrap_y_del_servidor(arranque, monkeypatch, clave):
    bootstrap, servidor = arranque
    monkeypatch.setenv("ORDEN_ENV", "production")
    if clave is not None:
        monkeypatch.setenv("FLASK_SECRET_KEY", clave)

    with pytest.raises(RuntimeError, match="FLASK_SECRET_KEY"):
        runpy.run_module("app", run_name="__main__")

    bootstrap.assert_not_called()
    servidor.assert_not_called()
