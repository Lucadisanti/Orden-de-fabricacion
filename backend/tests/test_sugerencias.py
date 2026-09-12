from unittest.mock import MagicMock, patch


def test_nombres_guardados_deduplicados_y_talleres_separados(client):
    conn = MagicMock(); cursor = conn.cursor.return_value
    cursor.fetchall.side_effect = [
        [{"tabla": "operarios_planilla", "columna": "nombre_operario"},
         {"tabla": "remitos", "columna": "recibido_por"},
         {"tabla": "produccion_diaria", "columna": "operario_calzado"}],
        [{"nombre_operario": " Ana ", "etapa": "Corte", "fecha": "2026-09-10"}, {"nombre_operario": "Taller Sur", "etapa": "Aparado", "fecha": "2026-09-10"}],
        [{"nombre": "ana", "fecha": "2026-09-09"}, {"nombre": "Luis", "fecha": "2026-09-08"}, {"nombre": None, "fecha": "2026-09-08"}],
        [{"nombre": "Ana | Juan", "fecha": "2026-09-10"}],
    ]
    with patch("routes.sugerencias_routes.get_connection", return_value=conn):
        response = client.get("/api/sugerencias/nombres")
    assert response.status_code == 200
    assert response.json == {"personas": ["Ana", "Juan", "Luis"], "talleres": ["Taller Sur"]}


def test_solo_cinco_nombres_mas_recientes(client):
    conn = MagicMock(); cursor = conn.cursor.return_value
    cursor.fetchall.side_effect = [
        [{"tabla": "remitos", "columna": "recibido_por"}],
        [{"nombre": nombre, "fecha": f"2026-09-{dia:02d}"} for dia, nombre in [
            (5, "Antiguo"), (9, "Eva"), (10, "Luis"), (11, "Ana"), (8, "Juan"), (7, "Luca"), (6, "ana"),
        ]],
    ]
    with patch("routes.sugerencias_routes.get_connection", return_value=conn):
        response = client.get("/api/sugerencias/nombres")
    assert response.json["personas"] == ["Ana", "Luis", "Eva", "Juan", "Luca"]
