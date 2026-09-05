from flask import jsonify, request
from db.connection import get_connection
from utils.db_helpers import responder_lista, responder_uno, responder_accion, responder_error_db
from utils.forced_deletes import eliminar_remito as eliminar_remito_forzado, responder_borrado_forzado


def _materiales_validos(data):
    materiales = data.get("materiales")
    if not isinstance(materiales, list) or not materiales:
        return None

    resultado = []
    for material in materiales:
        if not material.get("materiales_id_material"):
            return None
        try:
            solicitada = float(material.get("cantidad_solicitada") or 0)
            recibida = float(material.get("cantidad_recibida") or 0)
        except (TypeError, ValueError):
            return None
        if solicitada < 0 or recibida < 0:
            return None
        resultado.append({
            "id_lote": material.get("id_lote"),
            "materiales_id_material": material.get("materiales_id_material"),
            "colores_id_color": material.get("colores_id_color") or None,
            "codigo_lote": material.get("codigo_lote") or None,
            "cantidad_solicitada": solicitada,
            "cantidad_recibida": recibida,
            "pendiente": solicitada - recibida,
            "observaciones": material.get("observaciones"),
        })
    return resultado


def _insertar_material(cursor, id_remito, material):
    cursor.execute(
        """
        INSERT INTO lote_materiales
          (remitos_id_remito, materiales_id_material, colores_id_color, codigo_lote,
           cantidad_solicitada, cantidad_recibida, pendiente, observaciones)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (id_remito, material["materiales_id_material"], material["colores_id_color"],
         material["codigo_lote"], material["cantidad_solicitada"],
         material["cantidad_recibida"], material["pendiente"], material["observaciones"]),
    )


def listar_remitos():
    return responder_lista("sp_listar_remitos")


def obtener_remito(id_remito):
    return responder_uno("sp_obtener_remito", (id_remito,))


def crear_remito():
    data = request.json or {}
    if "materiales" in data:
        materiales = _materiales_validos(data)
        if not materiales:
            return jsonify({"mensaje": "Debe cargar al menos un material válido."}), 400
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO remitos
                  (numero_remito, fecha_solicitud, fecha_entrega, estado_recepcion,
                   recibido_por, proveedores_id_proveedor)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (data.get("numero_remito"), data.get("fecha_solicitud"), data.get("fecha_entrega"),
                 data.get("estado_recepcion") or "recibido", data.get("recibido_por"),
                 data.get("proveedores_id_proveedor")),
            )
            id_remito = cursor.lastrowid
            for material in materiales:
                _insertar_material(cursor, id_remito, material)
            conn.commit()
            return jsonify({"id_remito": id_remito, "mensaje": "Recepción creada correctamente"}), 201
        except Exception as error:
            if conn:
                conn.rollback()
            return responder_error_db(error)
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    return responder_accion(
        "sp_crear_remito",
        (
            data.get("numero_remito"),
            data.get("fecha_solicitud"),
            data.get("fecha_entrega"),
            data.get("estado_recepcion"),
            data.get("recibido_por"),
            data.get("proveedores_id_proveedor"),
        ),
        201,
    )


def actualizar_remito(id_remito):
    data = request.json or {}
    if "materiales" in data:
        materiales = _materiales_validos(data)
        if not materiales:
            return jsonify({"mensaje": "Debe cargar al menos un material válido."}), 400
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE remitos
                SET numero_remito = %s, fecha_solicitud = %s, fecha_entrega = %s,
                    estado_recepcion = %s, recibido_por = %s, proveedores_id_proveedor = %s
                WHERE id_remito = %s
                """,
                (data.get("numero_remito"), data.get("fecha_solicitud"), data.get("fecha_entrega"),
                 data.get("estado_recepcion") or "recibido", data.get("recibido_por"),
                 data.get("proveedores_id_proveedor"), id_remito),
            )
            cursor.execute("SELECT id_lote FROM lote_materiales WHERE remitos_id_remito = %s", (id_remito,))
            existentes = {fila[0] for fila in cursor.fetchall()}
            conservados = set()
            for material in materiales:
                id_lote = material["id_lote"]
                if id_lote and int(id_lote) in existentes:
                    conservados.add(int(id_lote))
                    cursor.execute(
                        """
                        UPDATE lote_materiales
                        SET materiales_id_material = %s, colores_id_color = %s, codigo_lote = %s,
                            cantidad_solicitada = %s, cantidad_recibida = %s, pendiente = %s,
                            observaciones = %s
                        WHERE id_lote = %s AND remitos_id_remito = %s
                        """,
                        (material["materiales_id_material"], material["colores_id_color"],
                         material["codigo_lote"], material["cantidad_solicitada"],
                         material["cantidad_recibida"], material["pendiente"],
                         material["observaciones"], id_lote, id_remito),
                    )
                else:
                    _insertar_material(cursor, id_remito, material)
            eliminados = existentes - conservados
            if eliminados:
                placeholders = ", ".join(["%s"] * len(eliminados))
                cursor.execute(
                    f"DELETE FROM lote_materiales WHERE remitos_id_remito = %s AND id_lote IN ({placeholders})",
                    (id_remito, *eliminados),
                )
            conn.commit()
            return jsonify({"mensaje": "Recepción actualizada correctamente"}), 200
        except Exception as error:
            if conn:
                conn.rollback()
            return responder_error_db(error)
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    return responder_accion(
        "sp_actualizar_remito",
        (
            id_remito,
            data.get("numero_remito"),
            data.get("fecha_solicitud"),
            data.get("fecha_entrega"),
            data.get("estado_recepcion"),
            data.get("recibido_por"),
            data.get("proveedores_id_proveedor"),
        ),
    )


def eliminar_remito(id_remito):
    if request.args.get("forzar") == "1":
        return responder_borrado_forzado(eliminar_remito_forzado, id_remito, "recepción")
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM lote_materiales WHERE remitos_id_remito = %s", (id_remito,))
        cursor.execute("DELETE FROM remitos WHERE id_remito = %s", (id_remito,))
        conn.commit()
        return jsonify({"mensaje": "Recepción eliminada correctamente"}), 200
    except Exception as error:
        if conn:
            conn.rollback()
        return responder_error_db(error)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
