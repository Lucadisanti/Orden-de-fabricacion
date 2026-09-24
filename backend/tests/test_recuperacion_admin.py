import hashlib
from unittest.mock import MagicMock

from werkzeug.security import check_password_hash

from controllers import auth_controller


def conexion_falsa(monkeypatch, fila):
    cursor = MagicMock()
    cursor.fetchone.return_value = fila
    conn = MagicMock()
    conn.cursor.return_value = cursor
    monkeypatch.setattr(auth_controller, "get_connection", lambda: conn)
    return conn, cursor


def test_codigo_se_guarda_como_hash_y_se_muestra_una_vez(client, monkeypatch):
    with client.session_transaction() as session:
        session["usuario"] = {**session["usuario"], "rol": "maestro"}
    conn, cursor = conexion_falsa(monkeypatch, {"usuario": "Admin"})
    response = client.post("/api/auth/usuarios/7/recuperacion")
    assert response.status_code == 200
    codigo = response.json["codigo"]
    assert len(codigo) >= 24
    guardado = next(call for call in cursor.execute.call_args_list if "INSERT INTO recuperacion_admin" in call.args[0])
    assert guardado.args[1] == (7, hashlib.sha256(codigo.encode()).hexdigest())
    assert codigo not in str(cursor.execute.call_args_list)
    conn.commit.assert_called_once()


def test_recuperacion_actualiza_clave_e_invalida_codigo(client, monkeypatch):
    codigo = "codigo-secreto-de-prueba"
    conn, cursor = conexion_falsa(monkeypatch, {
        "id_usuario": 7, "rol": "maestro", "activo": 1,
        "codigo_hash": hashlib.sha256(codigo.encode()).hexdigest(),
    })
    with client.session_transaction() as session:
        session.clear()
    response = client.post("/api/auth/recuperar", json={
        "usuario": "Admin", "codigo": codigo, "contrasena": "NuevaClave123",
    })
    assert response.status_code == 200
    update = next(call for call in cursor.execute.call_args_list if "UPDATE usuarios SET password_hash" in call.args[0])
    assert check_password_hash(update.args[1][0], "NuevaClave123")
    assert any("DELETE FROM recuperacion_admin" in call.args[0] for call in cursor.execute.call_args_list)
    conn.commit.assert_called_once()


def test_codigo_incorrecto_no_cambia_clave(client, monkeypatch):
    conn, cursor = conexion_falsa(monkeypatch, {
        "id_usuario": 7, "rol": "admin", "activo": 1,
        "codigo_hash": hashlib.sha256(b"correcto").hexdigest(),
    })
    response = client.post("/api/auth/recuperar", json={
        "usuario": "Admin", "codigo": "incorrecto", "contrasena": "NuevaClave123",
    })
    assert response.status_code == 400
    assert not any("UPDATE usuarios SET password_hash" in call.args[0] for call in cursor.execute.call_args_list)
    conn.commit.assert_not_called()


def test_empleado_no_puede_generar_codigo(client, monkeypatch):
    with client.session_transaction() as session:
        session["usuario"] = {**session["usuario"], "rol": "empleado"}
    conn, _ = conexion_falsa(monkeypatch, None)
    response = client.post("/api/auth/usuarios/7/recuperacion")
    assert response.status_code == 403
    conn.cursor.assert_not_called()
