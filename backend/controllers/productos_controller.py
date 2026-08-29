from flask import jsonify, request
from db.connection import get_connection
from utils.db_helpers import responder_lista, responder_uno, responder_accion
from utils.forced_deletes import eliminar_producto as eliminar_producto_forzado, responder_borrado_forzado, responder_borrado_simple


def validar_producto(data):
    campos_obligatorios = (
        "articulo_producto",
        "nombre_producto",
        "colores_id_color",
    )

    if any(data.get(campo) in (None, "") for campo in campos_obligatorios):
        return "Todos los campos del producto son obligatorios"

    if not str(data["articulo_producto"]).strip() or not str(data["nombre_producto"]).strip():
        return "Articulo y nombre no pueden estar vacios"

    try:
        if int(data["colores_id_color"]) <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return "El color seleccionado no es valido"

    return None


def _usa_codigo_compuesto(data):
    return all(data.get(campo) not in (None, "") for campo in (
        "modelos_calzado_id_modelo", "punteras_id_puntera", "colores_id_color"
    ))


def _guardar_producto_compuesto(data, id_producto=None):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT m.codigo_modelo, m.nombre_modelo, p.codigo_puntera, c.codigo_color
            FROM modelos_calzado m
            INNER JOIN punteras p ON p.id_puntera = %s AND p.activo = 1
            INNER JOIN colores c ON c.id_color = %s
            WHERE m.id_modelo = %s AND m.activo = 1
            """,
            (data.get("punteras_id_puntera"), data.get("colores_id_color"), data.get("modelos_calzado_id_modelo")),
        )
        componentes = cursor.fetchone()
        if not componentes or not componentes.get("codigo_color"):
            return jsonify({"mensaje": "El modelo, la puntera o el color no tienen un codigo valido"}), 400

        ids_adicionales = list(dict.fromkeys(int(valor) for valor in data.get("adicionales", []) if valor))
        adicionales = []
        if ids_adicionales:
            placeholders = ", ".join(["%s"] * len(ids_adicionales))
            cursor.execute(
                f"SELECT id_adicional, codigo_adicional FROM adicionales WHERE activo = 1 AND id_adicional IN ({placeholders})",
                tuple(ids_adicionales),
            )
            adicionales_por_id = {fila["id_adicional"]: fila["codigo_adicional"] for fila in cursor.fetchall()}
            if len(adicionales_por_id) != len(ids_adicionales):
                return jsonify({"mensaje": "Uno de los adicionales seleccionados no es valido"}), 400
            adicionales = [adicionales_por_id[id_adicional] for id_adicional in ids_adicionales]

        articulo = "".join([
            componentes["codigo_modelo"],
            componentes["codigo_puntera"],
            *adicionales,
            componentes["codigo_color"],
        ])
        nombre = str(data.get("nombre_producto") or componentes["nombre_modelo"]).strip()

        if id_producto is None:
            cursor.execute(
                """
                INSERT INTO producto
                  (articulo_producto, nombre_producto, colores_id_color, modelos_calzado_id_modelo, punteras_id_puntera)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (articulo, nombre, data.get("colores_id_color"), data.get("modelos_calzado_id_modelo"), data.get("punteras_id_puntera")),
            )
            id_producto = cursor.lastrowid
        else:
            cursor.execute(
                """
                UPDATE producto SET articulo_producto = %s, nombre_producto = %s,
                  colores_id_color = %s, modelos_calzado_id_modelo = %s, punteras_id_puntera = %s
                WHERE id_producto = %s
                """,
                (articulo, nombre, data.get("colores_id_color"), data.get("modelos_calzado_id_modelo"), data.get("punteras_id_puntera"), id_producto),
            )
            cursor.execute("DELETE FROM producto_adicionales WHERE producto_id_producto = %s", (id_producto,))

        if ids_adicionales:
            cursor.executemany(
                "INSERT INTO producto_adicionales (producto_id_producto, adicionales_id_adicional, orden) VALUES (%s, %s, %s)",
                [(id_producto, id_adicional, orden) for orden, id_adicional in enumerate(ids_adicionales, 1)],
            )
        conn.commit()
        return jsonify({"id_producto": id_producto, "articulo_producto": articulo, "mensaje": "Producto guardado correctamente"}), 201 if data.get("_creando") else 200
    except Exception as error:
        if conn:
            conn.rollback()
        mensaje = "Ya existe un producto con esa combinacion" if "Duplicate entry" in str(error) else "Ocurrio un error al guardar el producto"
        return jsonify({"mensaje": mensaje}), 409 if "Duplicate entry" in str(error) else 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def listar_productos():
    return responder_lista("sp_listar_productos")


def obtener_producto(id_producto):
    return responder_uno("sp_obtener_producto", (id_producto,))


def crear_producto():
    data = request.json or {}
    if _usa_codigo_compuesto(data):
        data["_creando"] = True
        return _guardar_producto_compuesto(data)
    error = validar_producto(data)
    if error:
        return {"mensaje": error}, 400

    return responder_accion(
        "sp_crear_producto",
        (
            data.get("articulo_producto"),
            data.get("nombre_producto"),
            data.get("colores_id_color"),
        ),
        201,
    )


def actualizar_producto(id_producto):
    data = request.json or {}
    if _usa_codigo_compuesto(data):
        return _guardar_producto_compuesto(data, id_producto)
    error = validar_producto(data)
    if error:
        return {"mensaje": error}, 400

    return responder_accion(
        "sp_actualizar_producto",
        (
            id_producto,
            data.get("articulo_producto"),
            data.get("nombre_producto"),
            data.get("colores_id_color"),
        ),
    )


def eliminar_producto(id_producto):
    if request.args.get("forzar") == "1":
        return responder_borrado_forzado(eliminar_producto_forzado, id_producto, "producto")
    return responder_borrado_simple("producto", "id_producto", id_producto, "producto")
