import pytest

from controllers.produccion_diaria_controller import validar_pares_defectuosos


@pytest.mark.parametrize("cantidad", [None, "", 0, -1, 101, 1.5, True])
def test_rechaza_cantidades_invalidas(cantidad):
    with pytest.raises(ValueError):
        validar_pares_defectuosos({"estado_inspeccion": "No conforme", "pares_defectuosos": cantidad}, 100)


@pytest.mark.parametrize("cantidad", [1, 5, 100, "5"])
def test_acepta_cantidad_parcial_y_total(cantidad):
    assert validar_pares_defectuosos({"estado_inspeccion": "No conforme", "pares_defectuosos": cantidad}, 100) == int(cantidad)


@pytest.mark.parametrize("estado", ["Pendiente", "Conforme"])
def test_limpia_cantidad_al_cambiar_estado(estado):
    assert validar_pares_defectuosos({"estado_inspeccion": estado, "pares_defectuosos": 5}, 100) == 0
