from unittest.mock import MagicMock, patch


def test_nombres_guardados_deduplicados_y_talleres_separados(client):
    conn = MagicMock(); cursor = conn.cursor.return_value
    cursor.fetchall.side_effect = [
        [{"tabla": "operarios_planilla", "columna": "nombre_operario"},
         {"tabla": "remitos", "columna": "recibido_por"},
         {"tabla": "produccion_diaria", "columna": "operario_calzado"}],
        [{"nombre_operario": " Ana ", "etapa": "Corte"}, {"nombre_operario": "Taller Sur", "etapa": "Aparado"}],
        [{"nombre": "ana"}, {"nombre": "Luis"}, {"nombre": None}],
        [{"nombre": "Ana | Juan"}],
    ]
    with patch("routes.sugerencias_routes.get_connection", return_value=conn):
        response = client.get("/api/sugerencias/nombres")
    assert response.status_code == 200
    assert response.json == {"personas": ["Ana", "Juan", "Luis"], "talleres": ["Taller Sur"]}
