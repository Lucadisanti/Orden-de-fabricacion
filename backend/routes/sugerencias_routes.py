from flask import Blueprint, jsonify, request
import json
from db.connection import get_connection

sugerencias_bp = Blueprint("sugerencias", __name__)

FUENTES = {"operarios_planilla": "id_operario_planilla", "remitos": "id_remito",
           "recepcion_cortes": "id_recepcion", "produccion_diaria": "id_produccion_diaria",
           "produccion_diaria_bloque": "id_bloque"}


def asegurar_historial(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS sugerencias_historial_limpieza (
        tipo VARCHAR(20) PRIMARY KEY, limites TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")


@sugerencias_bp.delete("/nombres")
def limpiar_nombres():
    tipo = request.args.get("tipo", "personas")
    if tipo not in ("personas", "talleres"):
        return jsonify({"error": "Tipo inválido."}), 400
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    try:
        asegurar_historial(cursor)
        cursor.execute("SELECT TABLE_NAME AS tabla FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()")
        tablas = {f["tabla"] for f in cursor.fetchall()}
        limites = {}
        for tabla, clave in FUENTES.items():
            if tabla in tablas:
                cursor.execute(f"SELECT COALESCE(MAX({clave}),0) AS ultimo FROM {tabla}")
                limites[tabla] = int(cursor.fetchone()["ultimo"])
        cursor.execute("INSERT INTO sugerencias_historial_limpieza (tipo,limites) VALUES (%s,%s) ON DUPLICATE KEY UPDATE limites=VALUES(limites)", (tipo, json.dumps(limites)))
        conn.commit()
        return jsonify({"mensaje": "Sugerencias limpiadas."})
    except Exception:
        conn.rollback()
        return jsonify({"error": "No se pudieron limpiar las sugerencias."}), 500
    finally:
        cursor.close(); conn.close()


@sugerencias_bp.get("/nombres")
def nombres():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        asegurar_historial(cursor)
        cursor.execute("SELECT tipo,limites FROM sugerencias_historial_limpieza")
        limites = {f["tipo"]: json.loads(f["limites"]) for f in cursor.fetchall()}
        # Older installations may not have all optional stages yet.
        cursor.execute("SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()")
        columnas = {(f["tabla"], f["columna"]) for f in cursor.fetchall()}
        personas, talleres = {}, {}

        def agregar(destino, valor, fecha, multiple=False):
            for nombre in str(valor or "").split("|") if multiple else [str(valor or "")]:
                nombre = " ".join(nombre.split())
                if nombre:
                    clave = nombre.casefold()
                    reciente = str(fecha or "")
                    if clave not in destino or reciente > destino[clave][0]:
                        destino[clave] = (reciente, nombre)

        if ("operarios_planilla", "nombre_operario") in columnas:
            cursor.execute("""SELECT op.nombre_operario, op.etapa, op.id_operario_planilla AS registro_id, p.fecha AS fecha
                FROM operarios_planilla op JOIN planilla_produccion p
                ON p.id_planilla=op.planilla_produccion_id_planilla ORDER BY p.fecha DESC, p.id_planilla DESC""")
            for fila in cursor.fetchall():
                tipo = "talleres" if str(fila["etapa"]).casefold() == "aparado" else "personas"
                if int(fila["registro_id"]) > limites.get(tipo, {}).get("operarios_planilla", 0):
                    agregar(talleres if tipo == "talleres" else personas, fila["nombre_operario"], fila["fecha"])
        for tabla, columna, multiple, origen, fecha, identificador in [
            ("remitos", "recibido_por", False, "remitos", "COALESCE(fecha_entrega,fecha_solicitud)", "id_remito"),
            ("recepcion_cortes", "controlador", False, "recepcion_cortes", "fecha", "id_recepcion"),
            ("produccion_diaria", "operario_calzado", True, "produccion_diaria", "fecha", "id_produccion_diaria"),
            ("produccion_diaria", "operario_puntera", True, "produccion_diaria", "fecha", "id_produccion_diaria"),
            ("produccion_diaria", "operario_inspeccion_final", True, "produccion_diaria", "fecha", "id_produccion_diaria"),
            ("produccion_diaria_bloque", "operario_inyeccion", True, "produccion_diaria_bloque b JOIN produccion_diaria d ON d.id_produccion_diaria=b.produccion_diaria_id", "d.fecha", "b.id_bloque"),
        ]:
            if (tabla, columna) in columnas:
                cursor.execute(f"SELECT {columna} AS nombre, {fecha} AS fecha FROM {origen} WHERE {identificador}>%s ORDER BY fecha DESC, {identificador} DESC", (limites.get("personas", {}).get(tabla, 0),))
                for fila in cursor.fetchall():
                    agregar(personas, fila["nombre"], fila["fecha"], multiple)
        def ultimos(valores):
            return [nombre for _, nombre in sorted(valores.values(), key=lambda item: item[0], reverse=True)[:5]]
        return jsonify({"personas": ultimos(personas), "talleres": ultimos(talleres)})
    finally:
        cursor.close()
        conn.close()
