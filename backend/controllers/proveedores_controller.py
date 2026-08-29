from flask import request
from utils.db_helpers import responder_lista, responder_uno, responder_accion
from utils.forced_deletes import eliminar_proveedor as eliminar_proveedor_forzado, responder_borrado_forzado, responder_borrado_simple


def _texto_opcional(valor):
    texto = str(valor or "").strip()
    return texto or None


def _datos_proveedor(data):
    nombre = str(data.get("nombre_proveedor") or "").strip()
    if not nombre:
        return None, "El nombre del proveedor es obligatorio"
    return (
        nombre,
        _texto_opcional(data.get("cuit")),
        _texto_opcional(data.get("telefono")),
        _texto_opcional(data.get("email")),
    ), None


def listar_proveedores():
    return responder_lista("sp_listar_proveedores")


def obtener_proveedor(id_proveedor):
    return responder_uno("sp_obtener_proveedor", (id_proveedor,))


def crear_proveedor():
    data = request.json or {}
    parametros, error = _datos_proveedor(data)
    if error:
        return {"mensaje": error}, 400
    return responder_accion(
        "sp_crear_proveedor",
        parametros,
        201,
    )


def actualizar_proveedor(id_proveedor):
    data = request.json or {}
    parametros, error = _datos_proveedor(data)
    if error:
        return {"mensaje": error}, 400
    return responder_accion(
        "sp_actualizar_proveedor",
        (id_proveedor, *parametros),
    )


def eliminar_proveedor(id_proveedor):
    if request.args.get("forzar") == "1":
        return responder_borrado_forzado(eliminar_proveedor_forzado, id_proveedor, "proveedor")
    return responder_borrado_simple("proveedores", "id_proveedor", id_proveedor, "proveedor")
