from unittest.mock import MagicMock, patch


def test_editar_modelo_actualiza_productos_y_variantes(client):
    conn = MagicMock()
    cursor = conn.cursor.return_value
    cursor.fetchone.return_value = (1,)
    with patch("controllers.catalogos_controller.get_connection", return_value=conn):
        respuesta = client.put("/api/catalogos/modelos-calzado/1", json={"codigo_modelo": "123", "nombre_modelo": "Modelo corregido"})
    assert respuesta.status_code == 200
    consultas = [c.args[0] for c in cursor.execute.call_args_list]
    assert any("UPDATE producto_variante" in sql for sql in consultas)
    assert any("BASE-" in sql for sql in consultas)
    conn.commit.assert_called_once()


def test_codigo_duplicado_revierte_cambios(client):
    conn = MagicMock()
    cursor = conn.cursor.return_value
    cursor.fetchone.return_value = (1,)
    cursor.execute.side_effect = [None, Exception("Duplicate entry")]
    with patch("controllers.catalogos_controller.get_connection", return_value=conn):
        respuesta = client.put("/api/catalogos/modelos-calzado/1", json={"codigo_modelo": "123", "nombre_modelo": "Modelo"})
    assert respuesta.status_code == 409
    conn.rollback.assert_called_once()
    conn.commit.assert_not_called()


def test_modelo_inexistente_no_actualiza(client):
    conn = MagicMock()
    conn.cursor.return_value.fetchone.return_value = None
    with patch("controllers.catalogos_controller.get_connection", return_value=conn):
        respuesta = client.put("/api/catalogos/modelos-calzado/99", json={"codigo_modelo": "123", "nombre_modelo": "Modelo"})
    assert respuesta.status_code == 404
    conn.commit.assert_not_called()
