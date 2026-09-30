from controllers.productos_controller import CAMPOS_CONSUMO, _consumos_producto


def test_normaliza_todos_los_consumos_del_producto():
    datos = {campo: indice / 10 for indice, campo in enumerate(CAMPOS_CONSUMO, 1)}
    assert _consumos_producto(datos) == datos


def test_usa_valor_inicial_y_corrige_valores_invalidos():
    consumos = _consumos_producto({"consumo_cuero_por_par": "invalido", "consumo_cromo_por_par": -1})
    assert consumos["consumo_cuero_por_par"] == 0.25
    assert consumos["consumo_cromo_por_par"] == 0
    assert all(consumos[campo] == 0 for campo in CAMPOS_CONSUMO if campo != "consumo_cuero_por_par")


def test_acepta_consumos_vacios():
    consumos = _consumos_producto({campo: "" for campo in CAMPOS_CONSUMO})
    assert all(valor == 0 for valor in consumos.values())
