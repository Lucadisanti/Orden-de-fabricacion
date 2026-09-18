from unittest.mock import MagicMock

from controllers import auth_controller
from werkzeug.security import generate_password_hash


def preparar_conexion(monkeypatch, destino):
    cursor = MagicMock()
    cursor.fetchone.return_value = destino
    conn = MagicMock()
    conn.cursor.return_value = cursor
    monkeypatch.setattr(auth_controller, "get_connection", lambda: conn)
    return conn, cursor


def test_admin_no_puede_modificar_cuenta_maestra(client, monkeypatch):
    conn, cursor = preparar_conexion(monkeypatch, {"id_usuario": 8, "rol": "maestro"})
    response = client.put("/api/auth/usuarios/8", json={"contrasena": "OtraClave123"})
    assert response.status_code == 403
    assert not any("UPDATE usuarios SET password_hash" in call.args[0] for call in cursor.execute.call_args_list)
    conn.commit.assert_not_called()


def test_admin_no_puede_crear_otro_administrador(client, monkeypatch):
    conn, _ = preparar_conexion(monkeypatch, None)
    response = client.post("/api/auth/usuarios", json={"usuario": "admincliente", "nombre": "Admin cliente", "contrasena": "ClaveSegura123", "rol": "admin"})
    assert response.status_code == 400
    conn.cursor.assert_not_called()


def test_maestro_puede_crear_administrador(client, monkeypatch):
    with client.session_transaction() as session:
        session["usuario"] = {**session["usuario"], "rol": "maestro"}
    conn, cursor = preparar_conexion(monkeypatch, None)
    response = client.post("/api/auth/usuarios", json={"usuario": "admincliente", "nombre": "Admin cliente", "contrasena": "ClaveSegura123", "rol": "admin"})
    assert response.status_code == 201
    insert = next(call for call in cursor.execute.call_args_list if "INSERT INTO usuarios" in call.args[0])
    assert insert.args[1][-1] == "admin"
    conn.commit.assert_called_once()


def test_cambio_de_clave_propia_exige_clave_actual(client, monkeypatch):
    conn, cursor = preparar_conexion(monkeypatch, {"id_usuario": 1, "rol": "admin", "password_hash": generate_password_hash("ClaveActual123")})
    response = client.put("/api/auth/usuarios/1", json={"contrasena": "NuevaClave123", "contrasena_actual": "incorrecta"})
    assert response.status_code == 400
    assert not any("UPDATE usuarios SET password_hash" in call.args[0] for call in cursor.execute.call_args_list)
    conn.commit.assert_not_called()


def test_admin_puede_eliminar_empleado(client, monkeypatch):
    conn, cursor = preparar_conexion(monkeypatch, {"id_usuario": 8, "rol": "empleado"})
    response = client.delete("/api/auth/usuarios/8")
    assert response.status_code == 200
    assert any("DELETE FROM usuarios" in call.args[0] for call in cursor.execute.call_args_list)
    conn.commit.assert_called_once()


def test_admin_no_puede_eliminar_maestro(client, monkeypatch):
    conn, cursor = preparar_conexion(monkeypatch, {"id_usuario": 8, "rol": "maestro"})
    response = client.delete("/api/auth/usuarios/8")
    assert response.status_code == 403
    assert not any("DELETE FROM usuarios" in call.args[0] for call in cursor.execute.call_args_list)
    conn.commit.assert_not_called()
