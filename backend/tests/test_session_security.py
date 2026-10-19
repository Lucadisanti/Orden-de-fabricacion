from copy import deepcopy
import hashlib
from unittest.mock import MagicMock

from flask import Flask
import pytest
from werkzeug.security import generate_password_hash

from app import app
from controllers import auth_controller
from utils import session_security


@pytest.fixture()
def cuentas(monkeypatch):
    monkeypatch.setitem(app.config, "TESTING", True)
    estado = {
        "fila": {
            "id_usuario": 41, "usuario": "CuentaAislada", "nombre": "Persona de prueba",
            "rol": "admin", "activo": 1, "password_hash": generate_password_hash("AnteriorSoloPrueba123"),
            "codigo_hash": hashlib.sha256(b"codigo-aislado-de-prueba").hexdigest(),
        },
        "caida": False, "consultas": [], "commits": 0,
    }

    def conectar():
        if estado["caida"]:
            raise RuntimeError("detalle interno de conexión simulado")
        cursor = MagicMock()

        def ejecutar(sql, parametros=()):
            estado["consultas"].append((sql, parametros))
            if sql.startswith("UPDATE usuarios SET password_hash"):
                estado["fila"]["password_hash"] = parametros[0]
            if sql.startswith("DELETE FROM recuperacion_admin"):
                estado["fila"]["codigo_hash"] = None

        cursor.execute.side_effect = ejecutar
        cursor.fetchone.side_effect = lambda: deepcopy(estado["fila"])
        cursor.fetchall.return_value = []
        conexion = MagicMock()
        conexion.cursor.return_value = cursor
        conexion.commit.side_effect = lambda: estado.update(commits=estado["commits"] + 1)
        return conexion

    monkeypatch.setattr(auth_controller, "get_connection", conectar)
    monkeypatch.setattr(session_security, "get_connection", conectar)
    return estado


def login(cliente, clave="AnteriorSoloPrueba123"):
    return cliente.post("/api/auth/login", json={"usuario": "CuentaAislada", "contrasena": clave})


def test_cuenta_existente_inicia_sesion_sin_exponer_hash_ni_huella(cuentas):
    cliente = app.test_client()
    response = login(cliente)
    assert response.status_code == 200
    assert set(response.json) == {"id", "usuario", "nombre", "rol"}
    assert cuentas["fila"]["password_hash"] not in response.get_data(as_text=True)
    assert cliente.get("/api/auth/me").json == response.json
    lecturas = [parametros for sql, parametros in cuentas["consultas"] if sql.startswith("SELECT id_usuario,usuario,nombre,rol,activo,password_hash")]
    assert lecturas == [(41,)]
    assert cuentas["commits"] == 0


@pytest.mark.parametrize("cambio", ["desactivada", "eliminada"])
def test_cuenta_desactivada_o_eliminada_pierde_acceso(cuentas, cambio):
    cliente = app.test_client()
    assert login(cliente).status_code == 200
    if cambio == "desactivada":
        cuentas["fila"]["activo"] = 0
    else:
        cuentas["fila"] = None
    assert cliente.get("/api/auth/usuarios").status_code == 401
    assert cliente.get_cookie(app.config["SESSION_COOKIE_NAME"]) is None
    assert cuentas["commits"] == 0


def test_reduccion_de_rol_impide_gestion_con_cookie_anterior(cuentas):
    cliente = app.test_client()
    assert login(cliente).status_code == 200
    assert cliente.get("/api/auth/usuarios").status_code == 200
    cuentas["fila"]["rol"] = "empleado"
    assert cliente.get("/api/auth/usuarios").status_code == 403
    assert cliente.get("/api/auth/me").json["rol"] == "empleado"
    assert cuentas["commits"] == 0


def test_maestro_degradado_no_puede_emitir_codigos_con_cookie_anterior(cuentas):
    cuentas["fila"]["rol"] = "maestro"
    cliente = app.test_client()
    assert login(cliente).status_code == 200
    cuentas["fila"]["rol"] = "admin"
    assert cliente.post("/api/auth/usuarios/41/recuperacion").status_code == 403
    assert cuentas["commits"] == 0


def test_password_existente_corta_sigue_permitiendo_login_legitimo(cuentas):
    # La política fuerte es para nuevas altas iniciales, no cambia contraseñas
    # de instalaciones anteriores sin coordinación con su titular.
    cuentas["fila"]["password_hash"] = generate_password_hash("Vieja123")
    cliente = app.test_client()
    assert login(cliente, "Vieja123").status_code == 200
    assert cliente.get("/api/auth/me").status_code == 200


def test_rol_y_nombre_vigentes_se_reflejan_sin_recrear_la_cuenta(cuentas):
    cuentas["fila"]["rol"] = "empleado"
    cliente = app.test_client()
    assert login(cliente).status_code == 200
    cuentas["fila"].update(rol="admin", nombre="Nombre vigente")
    response = cliente.get("/api/auth/me")
    assert response.json["rol"] == "admin"
    assert response.json["nombre"] == "Nombre vigente"
    assert cliente.get("/api/auth/usuarios").status_code == 200


def test_cambio_de_contrasena_invalida_todos_los_dispositivos(cuentas):
    primera, segunda = app.test_client(), app.test_client()
    assert login(primera).status_code == login(segunda).status_code == 200
    response = primera.put("/api/auth/usuarios/41", json={
        "contrasena_actual": "AnteriorSoloPrueba123", "contrasena": "NuevaSoloPrueba456",
    })
    assert response.status_code == 200
    assert cuentas["commits"] == 1
    assert primera.get("/api/auth/me").status_code == 401
    assert segunda.get("/api/auth/me").status_code == 401
    assert login(primera, "NuevaSoloPrueba456").status_code == 200
    assert primera.get("/api/auth/me").status_code == 200


def test_recuperacion_invalida_sesiones_previas_y_conserva_acceso_nuevo(cuentas):
    cuentas["fila"]["rol"] = "maestro"
    cliente = app.test_client()
    assert login(cliente).status_code == 200
    response = app.test_client().post("/api/auth/recuperar", json={
        "usuario": "CuentaAislada", "codigo": "codigo-aislado-de-prueba", "contrasena": "RecuperadaSoloPrueba456",
    })
    assert response.status_code == 200
    assert cuentas["fila"]["codigo_hash"] is None
    assert cliente.get("/api/auth/me").status_code == 401
    assert login(cliente, "RecuperadaSoloPrueba456").status_code == 200


def test_cookie_de_version_anterior_requiere_login_pero_no_bloquea_cuenta(cuentas):
    cliente = app.test_client()
    with cliente.session_transaction() as sesion:
        sesion["usuario"] = {"id": 41, "rol": "maestro"}
    assert cliente.get("/api/auth/usuarios").status_code == 401
    assert cuentas["consultas"] == []
    assert login(cliente).status_code == 200
    assert cliente.get("/api/auth/me").status_code == 200


def test_api_rechaza_cookie_firmada_con_clave_ajena_antes_de_consultar_db(cuentas):
    ajena = Flask("firma-ajena")
    ajena.secret_key = "clave-conocida-ajena-solo-para-pruebas"
    cookie = ajena.session_interface.get_signing_serializer(ajena).dumps({
        "usuario": {"id": 41, "rol": "maestro"}, "_credencial": "0" * 64,
    })
    cliente = app.test_client()
    cliente.set_cookie(app.config["SESSION_COOKIE_NAME"], cookie)
    assert cliente.get("/api/auth/usuarios").status_code == 401
    assert cuentas["consultas"] == []


@pytest.mark.parametrize("huella", ["0" * 64, "ñ" * 64, None])
def test_huella_incorrecta_o_malformada_no_autoriza(cuentas, huella):
    cliente = app.test_client()
    assert login(cliente).status_code == 200
    with cliente.session_transaction() as sesion:
        sesion["_credencial"] = huella
    assert cliente.get("/api/auth/usuarios").status_code == 401


def test_falla_de_db_deniega_operacion_sin_borrar_sesion(cuentas):
    cliente = app.test_client()
    assert login(cliente).status_code == 200
    cookie = cliente.get_cookie(app.config["SESSION_COOKIE_NAME"])
    cuentas["caida"] = True
    response = cliente.get("/api/auth/usuarios")
    assert response.status_code == 503
    assert "detalle interno" not in response.get_data(as_text=True)
    assert cliente.get_cookie(app.config["SESSION_COOKIE_NAME"]) == cookie
    cuentas["caida"] = False
    assert cliente.get("/api/auth/me").status_code == 200


def test_logout_sigue_disponible_aunque_falle_la_base(cuentas):
    cliente = app.test_client()
    assert login(cliente).status_code == 200
    cuentas["caida"] = True
    assert cliente.post("/api/auth/logout").status_code == 204
    assert cliente.get_cookie(app.config["SESSION_COOKIE_NAME"]) is None
