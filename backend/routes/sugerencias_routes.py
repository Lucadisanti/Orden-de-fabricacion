from flask import Blueprint, jsonify, request
import json
from db.connection import get_connection

sugerencias_bp = Blueprint("sugerencias", __name__)

FUENTES = {
    "operarios_planilla": "id_operario_planilla", "remitos": "id_remito",
    "recepcion_cortes": "id_recepcion", "produccion_diaria": "id_produccion_diaria",
    "produccion_diaria_bloque": "id_bloque",
}
CAMPOS = {
    "operario_corte": {"etapa": "Corte"},
    "taller_aparado": {"etapa": "Aparado"},
    "operarios_calzado": {"etapa": "Calzado", "origen": ("produccion_diaria", "operario_calzado", "produccion_diaria", "fecha", "id_produccion_diaria")},
    "operarios_puntera": {"etapa": "Puntera", "origen": ("produccion_diaria", "operario_puntera", "produccion_diaria", "fecha", "id_produccion_diaria")},
    "operarios_inyeccion": {"etapa": "Inyección", "origen": ("produccion_diaria_bloque", "operario_inyeccion", "produccion_diaria_bloque b JOIN produccion_diaria d ON d.id_produccion_diaria=b.produccion_diaria_id", "d.fecha", "b.id_bloque")},
    "operarios_inspeccion_final": {"etapa": "Inspección final", "origen": ("produccion_diaria", "operario_inspeccion_final", "produccion_diaria", "fecha", "id_produccion_diaria")},
    "recibido_por": {"origen": ("remitos", "recibido_por", "remitos", "COALESCE(fecha_entrega,fecha_solicitud)", "id_remito")},
    "controlador": {"origen": ("recepcion_cortes", "controlador", "recepcion_cortes", "fecha", "id_recepcion")},
}


def asegurar_historial(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS sugerencias_historial_limpieza (
        tipo VARCHAR(50) PRIMARY KEY, limites TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")
    cursor.execute("ALTER TABLE sugerencias_historial_limpieza MODIFY tipo VARCHAR(50) NOT NULL")


def campo_solicitado():
    campo = request.args.get("campo", "")
    return campo if campo in CAMPOS else None


@sugerencias_bp.delete("/nombres")
def limpiar_nombres():
    campo = campo_solicitado()
    if not campo:
        return jsonify({"error": "Campo inválido."}), 400
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
        cursor.execute("INSERT INTO sugerencias_historial_limpieza (tipo,limites) VALUES (%s,%s) ON DUPLICATE KEY UPDATE limites=VALUES(limites)", (campo, json.dumps(limites)))
        conn.commit()
        return jsonify({"mensaje": "Sugerencias limpiadas."})
    except Exception:
        conn.rollback()
        return jsonify({"error": "No se pudieron limpiar las sugerencias."}), 500
    finally:
        cursor.close(); conn.close()


@sugerencias_bp.get("/nombres")
def nombres():
    campo = campo_solicitado()
    if not campo:
        return jsonify({"error": "Campo inválido."}), 400
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    try:
        asegurar_historial(cursor)
        cursor.execute("SELECT limites FROM sugerencias_historial_limpieza WHERE tipo=%s", (campo,))
        fila_limites = cursor.fetchone()
        limites = json.loads(fila_limites["limites"]) if fila_limites else {}
        cursor.execute("SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()")
        columnas = {(f["tabla"], f["columna"]) for f in cursor.fetchall()}
        sugerencias = {}

        def agregar(valor, fecha, multiple=False):
            for nombre in str(valor or "").split("|") if multiple else [str(valor or "")]:
                nombre = " ".join(nombre.split())
                if nombre:
                    clave = nombre.casefold()
                    reciente = str(fecha or "")
                    if clave not in sugerencias or reciente > sugerencias[clave][0]:
                        sugerencias[clave] = (reciente, nombre)

        config = CAMPOS[campo]
        if config.get("etapa") and ("operarios_planilla", "nombre_operario") in columnas:
            cursor.execute("""SELECT op.nombre_operario, op.id_operario_planilla AS registro_id, p.fecha AS fecha
                FROM operarios_planilla op JOIN planilla_produccion p ON p.id_planilla=op.planilla_produccion_id_planilla
                WHERE LOWER(op.etapa)=LOWER(%s) ORDER BY p.fecha DESC, p.id_planilla DESC""", (config["etapa"],))
            for fila in cursor.fetchall():
                if int(fila["registro_id"]) > limites.get("operarios_planilla", 0):
                    agregar(fila["nombre_operario"], fila["fecha"])
        if config.get("origen"):
            tabla, columna, origen, fecha, identificador = config["origen"]
            if (tabla, columna) in columnas:
                cursor.execute(f"SELECT {columna} AS nombre, {fecha} AS fecha FROM {origen} WHERE {identificador}>%s ORDER BY fecha DESC, {identificador} DESC", (limites.get(tabla, 0),))
                for fila in cursor.fetchall():
                    agregar(fila["nombre"], fila["fecha"], multiple=True)
        ultimos = [nombre for _, nombre in sorted(sugerencias.values(), key=lambda item: item[0], reverse=True)[:10]]
        return jsonify({"sugerencias": ultimos})
    finally:
        cursor.close(); conn.close()
