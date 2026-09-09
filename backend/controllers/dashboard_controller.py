from utils.db_helpers import responder_lista
from flask import jsonify
from db.connection import get_connection


def resumen_dashboard():
    respuesta, estado = responder_lista("sp_dashboard_resumen")
    if estado != 200:
        return respuesta, estado
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS total FROM planilla_produccion WHERE UPPER(TRIM(numero_planilla)) = 'R013/1'")
        total = cursor.fetchone()["total"]
        datos = respuesta.get_json()
        for item in datos:
            if item["titulo"] == "Planillas":
                item["valor"] = total
        return jsonify(datos), 200
    finally:
        cursor.close()
        conn.close()
