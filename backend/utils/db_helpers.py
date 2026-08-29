from datetime import date, datetime
from decimal import Decimal
from flask import jsonify
from db.connection import get_connection


def serializar_valor(valor):
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    if isinstance(valor, Decimal):
        return float(valor)
    return valor


def serializar_fila(fila):
    return {clave: serializar_valor(valor) for clave, valor in fila.items()}


def serializar_filas(filas):
    return [serializar_fila(fila) for fila in filas]


def responder_error_db(error):
    detalle = str(error or "")
    detalle_lower = detalle.lower()

    if "1451" in detalle or "cannot delete or update a parent row" in detalle_lower:
        return jsonify({
            "mensaje": "No se puede eliminar porque el registro está en uso y debe conservarse para mantener la trazabilidad.",
            "codigo": "REGISTRO_EN_USO",
        }), 409

    if "1452" in detalle or "cannot add or update a child row" in detalle_lower:
        return jsonify({
            "mensaje": "Uno de los registros seleccionados ya no existe. Actualizá la pantalla y volvé a intentarlo.",
            "codigo": "REFERENCIA_INVALIDA",
        }), 409

    if "1062" in detalle or "duplicate entry" in detalle_lower:
        return jsonify({
            "mensaje": "Ya existe un registro con esos datos.",
            "codigo": "REGISTRO_DUPLICADO",
        }), 409

    return jsonify({"mensaje": "Ocurrió un error al procesar la solicitud."}), 500


def ejecutar_sp(nombre_sp, parametros=()):
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        placeholders = ", ".join(["%s"] * len(parametros))
        query = f"CALL {nombre_sp}({placeholders})"

        cursor.execute(query, parametros)
        filas = cursor.fetchall() if cursor.with_rows else []

        while cursor.nextset():
            pass

        conn.commit()
        return serializar_filas(filas), None

    except Exception as e:
        if conn:
            conn.rollback()
        return None, str(e)

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def responder_lista(nombre_sp, parametros=()):
    filas, error = ejecutar_sp(nombre_sp, parametros)
    if error:
        return responder_error_db(error)
    return jsonify(filas), 200


def responder_uno(nombre_sp, parametros=()):
    filas, error = ejecutar_sp(nombre_sp, parametros)
    if error:
        return responder_error_db(error)

    if not filas:
        return jsonify({"mensaje": "Registro no encontrado"}), 404

    return jsonify(filas[0]), 200


def responder_accion(nombre_sp, parametros=(), status=200):
    filas, error = ejecutar_sp(nombre_sp, parametros)
    if error:
        return responder_error_db(error)

    if filas:
        return jsonify(filas[0]), status

    return jsonify({"mensaje": "Operación realizada correctamente"}), status
