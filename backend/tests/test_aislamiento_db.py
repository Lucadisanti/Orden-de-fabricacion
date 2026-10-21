from unittest.mock import MagicMock

import mysql.connector
import pytest

from db.connection import get_connection


@pytest.mark.parametrize("usar_helper", [False, True], ids=["driver", "helper"])
def test_conexiones_sin_mock_se_bloquean_antes_de_abrir_mysql(monkeypatch, usar_helper):
    # Segunda barrera: si se pierde el guard de conftest, el test debe fallar
    # sin que el driver llegue a abrir una conexión de verdad.
    driver = MagicMock()
    monkeypatch.setattr(mysql.connector, "MySQLConnection", driver)
    monkeypatch.setattr(mysql.connector, "CMySQLConnection", driver, raising=False)

    llamada = get_connection if usar_helper else mysql.connector.connect
    with pytest.raises(RuntimeError, match="no permiten conexiones reales a MySQL"):
        llamada()

    driver.assert_not_called()
