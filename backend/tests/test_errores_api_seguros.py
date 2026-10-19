from copy import deepcopy
from unittest.mock import MagicMock

import pytest

from controllers import (
    lotes_controller,
    ordenes_controller,
    produccion_diaria_controller,
    productos_controller,
)


PRODUCTO = {"modelos_calzado_id_modelo": 1, "colores_id_color": 2}
ORDEN = {
    "producto_id_producto": 1, "numero_orden": "PRUEBA", "fecha": "2026-10-19",
    "talles": [{"talle": "35", "cantidad_pares": 1}],
}
LINEA = {"punteras_id_puntera": 1, "talles": [{"talle": "35", "cantidad_pares": 1}]}
EDICION_PRODUCCION = {
    "fecha": "2026-10-19", "maquinas_id_maquina": 1,
    "operarios_calzado": ["Ana"], "operarios_puntera": ["Luis"],
    "operarios_inyeccion": ["Eva"], "linea": LINEA,
}
PRODUCCION = {
    "fecha": "2026-10-19", "operarios_calzado": ["Ana"], "operarios_puntera": ["Luis"],
    "bloques": [{
        "maquinas_id_maquina": 1, "operarios_inyeccion": ["Eva"],
        "lineas": [{**LINEA, "orden_fabricacion_id_orden": 1}],
    }],
}
CASOS = [
    (productos_controller, "POST", "/api/productos/", PRODUCTO, "mensaje"),
    (productos_controller, "PUT", "/api/productos/1", PRODUCTO, "mensaje"),
    (ordenes_controller, "POST", "/api/ordenes/", ORDEN, "error"),
    (ordenes_controller, "PUT", "/api/ordenes/1", ORDEN, "error"),
    (lotes_controller, "PUT", "/api/lotes/1/estado-stock", {"cerrar": True}, "error"),
    (produccion_diaria_controller, "POST", "/api/produccion-diaria/", PRODUCCION, "mensaje"),
    (produccion_diaria_controller, "PUT", "/api/produccion-diaria/linea/1", EDICION_PRODUCCION, "mensaje"),
]


def simular_fallo_db(monkeypatch, controlador, error):
    cursor = MagicMock()
    cursor.execute.side_effect = error
    conexion = MagicMock()
    conexion.cursor.return_value = cursor
    monkeypatch.setattr(controlador, "get_connection", lambda: conexion)
    return conexion, cursor


@pytest.mark.parametrize("controlador,metodo,ruta,datos,campo", CASOS)
def test_fallo_interno_no_expone_detalles_y_revierte_transaccion(
    client, monkeypatch, controlador, metodo, ruta, datos, campo,
):
    detalle = "SQLSTATE[HY000]: detalle-interno-sintetico /ruta/privada SELECT columna_interna"
    conexion, cursor = simular_fallo_db(monkeypatch, controlador, RuntimeError(detalle))

    response = client.open(ruta, method=metodo, json=deepcopy(datos))

    assert response.status_code == 500
    assert set(response.json) == {campo}
    assert response.json[campo]
    assert "detalle-interno-sintetico" not in response.get_data(as_text=True)
    assert "SQLSTATE" not in response.get_data(as_text=True)
    assert "/ruta/privada" not in response.get_data(as_text=True)
    conexion.rollback.assert_called_once()
    conexion.commit.assert_not_called()
    cursor.close.assert_called_once()
    conexion.close.assert_called_once()


@pytest.mark.parametrize("metodo,ruta", [("POST", "/api/productos/"), ("PUT", "/api/productos/1")])
def test_duplicado_de_producto_conserva_estado_y_mensaje(client, monkeypatch, metodo, ruta):
    conexion, _ = simular_fallo_db(
        monkeypatch, productos_controller, RuntimeError("1062 Duplicate entry 'valor-sintetico'"),
    )

    response = client.open(ruta, method=metodo, json=deepcopy(PRODUCTO))

    assert response.status_code == 409
    assert response.json == {"mensaje": "Ya existe ese producto y color"}
    conexion.rollback.assert_called_once()
    conexion.commit.assert_not_called()


def test_validacion_de_produccion_sigue_siendo_amigable_sin_acceder_a_db(client, monkeypatch):
    conectar = MagicMock()
    monkeypatch.setattr(produccion_diaria_controller, "get_connection", conectar)
    datos = deepcopy(EDICION_PRODUCCION)
    datos["linea"]["estado_inspeccion"] = "No conforme"

    response = client.put("/api/produccion-diaria/linea/1", json=datos)

    assert response.status_code == 400
    assert response.json == {"mensaje": "Indicá la observación de la no conformidad."}
    conectar.assert_not_called()
