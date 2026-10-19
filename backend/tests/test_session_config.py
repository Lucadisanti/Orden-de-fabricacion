import secrets

from flask import Flask, jsonify, session
import pytest

from utils.session_config import configurar_clave_sesion


@pytest.fixture(autouse=True)
def entorno_limpio(monkeypatch):
    for nombre in ("ORDEN_ENV", "TESTING", "FLASK_SECRET_KEY"):
        monkeypatch.delenv(nombre, raising=False)


def test_produccion_sin_clave_no_arranca():
    with pytest.raises(RuntimeError, match="Falta FLASK_SECRET_KEY"):
        configurar_clave_sesion(Flask(__name__))


@pytest.mark.parametrize("explicito", [False, True])
def test_indicador_testing_no_rebaja_el_modo_produccion(monkeypatch, explicito):
    monkeypatch.setenv("TESTING", "1")
    if explicito:
        monkeypatch.setenv("ORDEN_ENV", "production")
    with pytest.raises(RuntimeError, match="Falta FLASK_SECRET_KEY"):
        configurar_clave_sesion(Flask(__name__))


@pytest.mark.parametrize("clave", ["", "secret", "x" * 64, " cambiar-esta-clave-antes-de-usar-123456 "])
def test_produccion_rechaza_claves_vacias_cortas_o_triviales(monkeypatch, clave):
    monkeypatch.setenv("FLASK_SECRET_KEY", clave)
    with pytest.raises(RuntimeError, match="FLASK_SECRET_KEY"):
        configurar_clave_sesion(Flask(__name__))


@pytest.mark.parametrize("entorno", ["development", "testing"])
def test_entornos_explicitos_generan_claves_distintas(monkeypatch, entorno):
    monkeypatch.setenv("ORDEN_ENV", entorno)
    if entorno == "testing":
        monkeypatch.setenv("TESTING", "1")
    primera, segunda = Flask("primera"), Flask("segunda")
    configurar_clave_sesion(primera)
    configurar_clave_sesion(segunda)
    assert primera.secret_key != segunda.secret_key
    assert len(primera.secret_key) >= 32


def test_testing_requiere_indicador_explicito(monkeypatch):
    monkeypatch.setenv("ORDEN_ENV", "testing")
    with pytest.raises(RuntimeError, match="TESTING=1"):
        configurar_clave_sesion(Flask(__name__))


def test_configuracion_invalida_no_habilita_desarrollo(monkeypatch):
    monkeypatch.setenv("ORDEN_ENV", "developmnt")
    with pytest.raises(RuntimeError, match="ORDEN_ENV"):
        configurar_clave_sesion(Flask(__name__))


def test_clave_persistente_valida_y_rechazo_de_sesion_falsificada(monkeypatch):
    clave = secrets.token_hex(32)
    monkeypatch.setenv("FLASK_SECRET_KEY", clave)
    app = Flask("produccion-aislada")
    configurar_clave_sesion(app)

    @app.get("/protegido")
    def protegido():
        return jsonify(session["usuario"]) if session.get("usuario") else (jsonify(error="Sesión requerida."), 401)

    ajena = Flask("firma-ajena")
    ajena.secret_key = "clave-conocida-ajena-solo-para-esta-prueba"
    falsa = ajena.session_interface.get_signing_serializer(ajena).dumps({"usuario": {"rol": "maestro"}})
    cliente = app.test_client()
    cliente.set_cookie(app.config["SESSION_COOKIE_NAME"], falsa)
    assert cliente.get("/protegido").status_code == 401

    with cliente.session_transaction() as sesion:
        sesion["usuario"] = {"rol": "empleado"}
    assert cliente.get("/protegido").status_code == 200
    reiniciada = Flask("reiniciada")
    configurar_clave_sesion(reiniciada)
    assert reiniciada.secret_key == app.secret_key == clave
