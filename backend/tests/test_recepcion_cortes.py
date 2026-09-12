from unittest.mock import MagicMock, patch
import pytest
from controllers.recepcion_cortes_controller import validar_limites


def preparar_cursor(conn):
    cursor = conn.cursor.return_value
    cursor.fetchall.side_effect = lambda: [{"cantidad_pares": 180}] if "SELECT cantidad_pares" in cursor.execute.call_args.args[0] else []
    return cursor


def datos():
    return {"fecha": "2026-09-11", "controlador": "Ana", "lineas": [
        {"orden_id": 1, "remito": "0001", "cantidad": 20, "estado": "Conforme", "observaciones": ""},
        {"orden_id": 2, "remito": "0002", "cantidad": 10, "estado": "No conforme", "observaciones": "Corte marcado"},
    ]}


def test_guarda_tanda_completa_con_datos_de_orden(client):
    conn = MagicMock(); cursor = preparar_cursor(conn); cursor.lastrowid = 7
    cursor.fetchone.side_effect = [
        {"numero_orden": "01", "articulo": "BASE-10001", "producto": "Bota", "color": "Negro"},
        {"numero_orden": "02", "articulo": "BASE-20001", "producto": "Zapato", "color": "Negro"},
    ]
    with patch("controllers.recepcion_cortes_controller.get_connection", return_value=conn):
        response = client.post("/api/recepcion-cortes/", json=datos())
    assert response.status_code == 200
    conn.commit.assert_called_once()
    filas = cursor.executemany.call_args.args[1]
    assert len(filas) == 2
    assert filas[0][:4] == (7, 1, "01", "BASE-10001")
    assert filas[1][-3:] == (10, "No conforme", "Corte marcado")


@pytest.mark.parametrize("campo,valor", [("cantidad", 0), ("cantidad", 1.5), ("remito", " "), ("estado", "Pendiente"), ("observaciones", " ")])
def test_rechaza_fila_invalida_sin_guardar(client, campo, valor):
    data = datos(); data["lineas"][1][campo] = valor
    with patch("controllers.recepcion_cortes_controller.get_connection") as conectar:
        response = client.post("/api/recepcion-cortes/", json=data)
    assert response.status_code == 400
    conectar.assert_not_called()


def test_orden_inexistente_no_guarda_ninguna_fila(client):
    conn = MagicMock(); cursor = preparar_cursor(conn)
    cursor.fetchone.side_effect = [{"numero_orden": "01", "articulo": "10001", "producto": "Bota", "color": "Negro"}, None]
    with patch("controllers.recepcion_cortes_controller.get_connection", return_value=conn):
        response = client.post("/api/recepcion-cortes/", json=datos())
    assert response.status_code == 400
    conn.rollback.assert_called_once(); conn.commit.assert_not_called(); cursor.executemany.assert_not_called()


def test_fallo_sql_revierte_tanda(client):
    conn = MagicMock(); cursor = preparar_cursor(conn)
    cursor.fetchone.return_value = {"numero_orden": "01", "articulo": "10001", "producto": "Bota", "color": "Negro"}
    cursor.executemany.side_effect = RuntimeError("fallo")
    with patch("controllers.recepcion_cortes_controller.get_connection", return_value=conn):
        response = client.post("/api/recepcion-cortes/", json=datos())
    assert response.status_code == 500
    conn.rollback.assert_called_once(); conn.commit.assert_not_called()


def test_edita_recepcion_sin_crear_otra_cabecera(client):
    conn = MagicMock(); cursor = preparar_cursor(conn)
    cursor.fetchone.side_effect = [
        {"id_recepcion": 7},
        {"numero_orden": "01", "articulo": "10001", "producto": "Bota", "color": "Negro"},
        {"numero_orden": "02", "articulo": "20001", "producto": "Zapato", "color": "Negro"},
    ]
    with patch("controllers.recepcion_cortes_controller.get_connection", return_value=conn):
        response = client.put("/api/recepcion-cortes/7", json=datos())
    assert response.status_code == 200
    assert response.json["id_recepcion"] == 7
    assert not any("INSERT INTO recepcion_cortes (" in call.args[0] for call in cursor.execute.call_args_list)
    conn.commit.assert_called_once()


@pytest.mark.parametrize("cantidades,recibido,edicion,permitido", [
    ([80], 100, None, True), ([81], 100, None, False),
    ([50, 31], 100, None, False), ([50, 30], 100, None, True),
    ([1], 180, None, False), ([80], 100, 7, True), ([81], 100, 7, False),
])
def test_limite_acumulado_y_edicion(cantidades, recibido, edicion, permitido):
    cursor = MagicMock()
    cursor.fetchall.side_effect = [[{"id_orden": 1}], [{"cantidad_pares": 100}, {"cantidad_pares": 80}], [{"cantidad": recibido}]]
    filas = [(1, "0001", cantidad, "Conforme", "") for cantidad in cantidades]
    if permitido:
        validar_limites(cursor, filas, edicion)
    else:
        with pytest.raises(ValueError, match="máximo"):
            validar_limites(cursor, filas, edicion)
    assert cursor.execute.call_args.args[1] == (1, edicion or 0)
    assert "recepcion_id<>%s FOR UPDATE" in cursor.execute.call_args.args[0]


def test_api_rechaza_exceso_sin_escribir(client):
    conn = MagicMock(); cursor = conn.cursor.return_value
    cursor.fetchall.side_effect = [[{"id_orden": 1}, {"id_orden": 2}], [{"cantidad_pares": 180}], [{"cantidad": 175}]]
    with patch("controllers.recepcion_cortes_controller.get_connection", return_value=conn):
        response = client.post("/api/recepcion-cortes/", json=datos())
    assert response.status_code == 409
    assert "máximo 5 pares" in response.json["error"]
    conn.rollback.assert_called_once(); conn.commit.assert_not_called(); cursor.executemany.assert_not_called()
