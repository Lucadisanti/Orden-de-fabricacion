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
        return jsonify({"error": error}), 500
    return jsonify(filas), 200


def responder_uno(nombre_sp, parametros=()):
    filas, error = ejecutar_sp(nombre_sp, parametros)
    if error:
        return jsonify({"error": error}), 500

    if not filas:
        return jsonify({"mensaje": "Registro no encontrado"}), 404

    return jsonify(filas[0]), 200


def responder_accion(nombre_sp, parametros=(), status=200):
    filas, error = ejecutar_sp(nombre_sp, parametros)
    if error:
        return jsonify({"error": error}), 500

    if filas:
        return jsonify(filas[0]), status

    return jsonify({"mensaje": "Operación realizada correctamente"}), status
