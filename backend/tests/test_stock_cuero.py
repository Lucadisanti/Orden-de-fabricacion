from decimal import Decimal
from unittest.mock import MagicMock

from controllers.ordenes_controller import _calcular_consumos_materiales, _normalizar_materiales


def test_calcula_consumo_y_faltante_de_cuero():
    cursor = MagicMock()
    cursor.fetchone.side_effect = [
        {"id_lote": 7, "cantidad_recibida": Decimal("2.00"), "material": "Cuero flor"},
        {"usado_otros": Decimal("0.50")},
    ]

    consumos, faltantes = _calcular_consumos_materiales(
        cursor,
        [{"lote_id": 7, "consumo_por_par": Decimal("0.25")}],
        total_pares=10,
    )

    assert consumos == [(7, Decimal("2.50"))]
    assert faltantes == [{
        "id_lote": 7,
        "material": "Cuero flor",
        "disponible": 1.5,
        "requerido": 2.5,
        "faltante": 1.0,
    }]


def test_materiales_antiguos_siguen_siendo_compatibles():
    assert _normalizar_materiales(["4", 4, 8]) == [
        {"lote_id": 4, "consumo_por_par": Decimal("0")},
        {"lote_id": 8, "consumo_por_par": Decimal("0")},
    ]
