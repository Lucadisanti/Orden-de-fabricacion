from unittest.mock import patch


def test_listar_productos_devuelve_una_lista(client):
    productos = [
        {
            "id_producto": 1,
            "articulo_producto": "ZAP-001",
            "nombre_producto": "Zapatilla urbana",
            "colores_id_color": 2,
        }
    ]

    with patch("utils.db_helpers.ejecutar_sp", return_value=(productos, None)):
        response = client.get("/api/productos/")

    assert response.status_code == 200
    assert response.get_json() == productos


def test_obtener_producto_inexistente_devuelve_404(client):
    with patch("utils.db_helpers.ejecutar_sp", return_value=([], None)):
        response = client.get("/api/productos/999")

    assert response.status_code == 404
    assert response.get_json() == {"mensaje": "Registro no encontrado"}


def test_crear_producto_valido_devuelve_201(client):
    producto_creado = {"id_producto": 7, "mensaje": "Producto creado"}
    datos = {
        "articulo_producto": "BOT-010",
        "nombre_producto": "Botin de trabajo",
        "colores_id_color": 3,
    }

    with patch("utils.db_helpers.ejecutar_sp", return_value=([producto_creado], None)) as ejecutar:
        response = client.post("/api/productos/", json=datos)

    assert response.status_code == 201
    assert response.get_json() == producto_creado
    ejecutar.assert_called_once_with("sp_crear_producto", ("BOT-010", "Botin de trabajo", 3))


def test_crear_producto_sin_nombre_devuelve_400_y_no_accede_a_la_bd(client):
    datos = {
        "articulo_producto": "BOT-010",
        "nombre_producto": "",
        "colores_id_color": 3,
    }

    with patch("utils.db_helpers.ejecutar_sp") as ejecutar:
        response = client.post("/api/productos/", json=datos)

    assert response.status_code == 400
    assert response.get_json() == {"mensaje": "Todos los campos del producto son obligatorios"}
    ejecutar.assert_not_called()


def test_error_interno_devuelve_un_mensaje_controlado(client):
    with patch(
        "utils.db_helpers.ejecutar_sp",
        return_value=(None, "Access denied for user root"),
    ):
        response = client.get("/api/productos/")

    assert response.status_code == 500
    assert response.get_json() == {"mensaje": "Ocurrio un error al procesar la solicitud"}
    assert "Access denied" not in response.get_data(as_text=True)

