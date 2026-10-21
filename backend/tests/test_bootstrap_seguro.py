from unittest.mock import MagicMock

import pytest
from werkzeug.security import check_password_hash

from controllers import auth_controller


@pytest.fixture()
def preparar(monkeypatch):
    monkeypatch.delenv("ORDEN_INITIAL_ADMIN_PASSWORD", raising=False)
    monkeypatch.delenv("ORDEN_INITIAL_ADMIN_USER", raising=False)

    def conexion(cantidad, bloqueo=1):
        cursor = MagicMock()
        cursor.fetchone.side_effect = [{"adquirido": bloqueo}, {"cantidad": cantidad}]
        conn = MagicMock()
        conn.cursor.return_value = cursor
        monkeypatch.setattr(auth_controller, "get_connection", lambda: conn)
        return conn, cursor

    return conexion


def escrituras_usuarios(cursor):
    return [c for c in cursor.execute.call_args_list if c.args[0].startswith(("INSERT INTO usuarios", "UPDATE usuarios", "DELETE FROM usuarios"))]


def test_instalacion_existente_no_cambia_usuarios_roles_ni_claves(preparar, monkeypatch):
    conexion, cursor = preparar(3)
    monkeypatch.setenv("ORDEN_INITIAL_ADMIN_PASSWORD", "NoDebeReemplazarNada123")

    auth_controller.configurar_admin()

    assert escrituras_usuarios(cursor) == []
    assert not any("ALTER TABLE" in c.args[0] for c in cursor.execute.call_args_list)
    conexion.commit.assert_not_called()
    cursor.close.assert_called_once()
    conexion.close.assert_called_once()


def test_instalacion_existente_no_requiere_password_inicial(preparar):
    conexion, cursor = preparar(1)
    auth_controller.configurar_admin()
    assert escrituras_usuarios(cursor) == []
    conexion.rollback.assert_not_called()


@pytest.mark.parametrize("clave", [None, "corta", "x" * 20, " ClavePrivadaDePrueba123 "])
def test_base_vacia_no_crea_cuentas_con_password_ausente_o_debil(preparar, monkeypatch, clave):
    conexion, cursor = preparar(0)
    if clave is not None:
        monkeypatch.setenv("ORDEN_INITIAL_ADMIN_PASSWORD", clave)
    with pytest.raises(RuntimeError, match="ORDEN_INITIAL_ADMIN_PASSWORD") as error:
        auth_controller.configurar_admin()
    if clave:
        assert clave not in str(error.value)
    assert escrituras_usuarios(cursor) == []
    conexion.commit.assert_not_called()
    conexion.rollback.assert_called_once()
    conexion.close.assert_called_once()


def test_base_vacia_crea_una_unica_cuenta_con_hash(preparar, monkeypatch):
    conexion, cursor = preparar(0)
    clave = "PrivadaSoloParaPrueba123"
    monkeypatch.setenv("ORDEN_INITIAL_ADMIN_PASSWORD", clave)
    monkeypatch.setenv("ORDEN_INITIAL_ADMIN_USER", "CuentaInicialPrueba")

    auth_controller.configurar_admin()

    escrituras = escrituras_usuarios(cursor)
    assert len(escrituras) == 1
    assert "'maestro'" in escrituras[0].args[0]
    parametros = escrituras[0].args[1]
    assert parametros[0] == "CuentaInicialPrueba"
    assert parametros[2] != clave
    assert check_password_hash(parametros[2], clave)
    conexion.commit.assert_called_once()
    assert any("RELEASE_LOCK" in c.args[0] for c in cursor.execute.call_args_list)


def test_no_inicializa_sin_bloqueo_exclusivo(preparar, monkeypatch):
    conexion, cursor = preparar(0, bloqueo=0)
    monkeypatch.setenv("ORDEN_INITIAL_ADMIN_PASSWORD", "PrivadaSoloParaPrueba123")
    with pytest.raises(RuntimeError, match="bloquear"):
        auth_controller.configurar_admin()
    assert escrituras_usuarios(cursor) == []
    conexion.commit.assert_not_called()
    conexion.close.assert_called_once()


def test_error_de_insert_revierte_sin_promocionar_cuentas(preparar, monkeypatch):
    conexion, cursor = preparar(0)
    monkeypatch.setenv("ORDEN_INITIAL_ADMIN_PASSWORD", "PrivadaSoloParaPrueba123")

    def ejecutar(sql, *args):
        if sql.startswith("INSERT INTO usuarios"):
            raise RuntimeError("Fallo simulado")

    cursor.execute.side_effect = ejecutar
    with pytest.raises(RuntimeError, match="Fallo simulado"):
        auth_controller.configurar_admin()
    conexion.rollback.assert_called_once()
    conexion.commit.assert_not_called()
    assert not any("UPDATE usuarios" in c.args[0] for c in cursor.execute.call_args_list)
    conexion.close.assert_called_once()
