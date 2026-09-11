from unittest.mock import MagicMock, patch
import pytest


@pytest.mark.parametrize("metodo,ruta,estado", [("post", "/api/ordenes/", 201), ("put", "/api/ordenes/1", 200)])
def test_guarda_orden_sin_operarios_ni_materiales(client, metodo, ruta, estado):
    conn = MagicMock()
    cursor = conn.cursor.return_value
    cursor.lastrowid = 1
    cursor.fetchone.side_effect = [{"Field": "fecha_aparado"}, None]
    with patch("controllers.ordenes_controller.get_connection", return_value=conn):
        respuesta = getattr(client, metodo)(ruta, json={
            "producto_id_producto": 1, "numero_orden": "1234", "fecha": "2026-09-11",
            "talles": [{"talle": "40", "cantidad_pares": 10}],
            "operario_corte": "", "materiales": [],
        })
    assert respuesta.status_code == estado
    conn.commit.assert_called_once()
    assert not any("INSERT INTO uso_materiales" in llamada.args[0] for llamada in cursor.executemany.call_args_list)
