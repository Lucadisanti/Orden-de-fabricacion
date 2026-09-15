from unittest.mock import MagicMock, patch


def test_sugerencias_separadas_por_campo_y_limitadas_a_diez(client):
    conn = MagicMock(); cursor = conn.cursor.return_value
    cursor.fetchone.return_value = None
    cursor.fetchall.side_effect = [
        [{"tabla": "produccion_diaria", "columna": "operario_calzado"}],
        [{"nombre": f"Calzado {i}", "fecha": f"2026-09-{i:02d}"} for i in range(1, 13)],
    ]
    with patch("routes.sugerencias_routes.get_connection", return_value=conn):
        response = client.get("/api/sugerencias/nombres?campo=operarios_calzado")
    assert response.status_code == 200
    assert response.json == {"sugerencias": [f"Calzado {i}" for i in range(12, 2, -1)]}
    assert all("puntera" not in llamada.args[0] for llamada in cursor.execute.call_args_list)


def test_limpiar_un_campo_no_afecta_los_otros(client):
    conn = MagicMock(); cursor = conn.cursor.return_value
    cursor.fetchall.return_value = [{"tabla": "produccion_diaria"}]
    cursor.fetchone.return_value = {"ultimo": 15}
    with patch("routes.sugerencias_routes.get_connection", return_value=conn):
        response = client.delete("/api/sugerencias/nombres?campo=operarios_calzado")
    assert response.status_code == 200
    assert cursor.execute.call_args.args[1] == ("operarios_calzado", '{"produccion_diaria": 15}')
    conn.commit.assert_called_once()


def test_rechaza_campos_desconocidos(client):
    assert client.get("/api/sugerencias/nombres?campo=personas").status_code == 400
    assert client.delete("/api/sugerencias/nombres?campo=personas").status_code == 400
