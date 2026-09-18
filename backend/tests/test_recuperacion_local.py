from pathlib import Path
import runpy
import sys
from unittest.mock import MagicMock

import mysql.connector
from werkzeug.security import check_password_hash


def test_herramienta_local_restablece_admin_e_invalida_codigo(monkeypatch, capsys):
    cursor = MagicMock()
    cursor.fetchone.side_effect = [{"id_usuario": 3}, {"Tables_in_orden_fabricacion": "recuperacion_admin"}]
    connection = MagicMock()
    connection.cursor.return_value = cursor
    monkeypatch.setattr(mysql.connector, "connect", lambda **kwargs: connection)
    for key, value in {"DB_HOST": "database", "DB_USER": "orden_app", "DB_PASSWORD": "prueba", "DB_NAME": "orden_fabricacion"}.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setattr(sys, "argv", ["recuperar-admin.py", "Admin"])
    script = Path(__file__).parents[2] / "entrega-cliente" / "scripts" / "recuperar-admin.py"
    runpy.run_path(str(script), run_name="__main__")

    calls = cursor.execute.call_args_list
    assert "rol='maestro'" in calls[0].args[0]
    update = next(call for call in calls if "UPDATE usuarios SET password_hash" in call.args[0])
    password = capsys.readouterr().out.split("Nueva contrasena temporal: ")[1].splitlines()[0]
    assert check_password_hash(update.args[1][0], password)
    assert any("DELETE FROM recuperacion_admin" in call.args[0] for call in calls)
    connection.commit.assert_called_once()
