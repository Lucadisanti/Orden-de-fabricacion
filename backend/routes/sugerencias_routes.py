from flask import Blueprint, jsonify
from db.connection import get_connection

sugerencias_bp = Blueprint("sugerencias", __name__)


@sugerencias_bp.get("/nombres")
def nombres():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Older installations may not have all optional stages yet.
        cursor.execute("SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()")
        columnas = {(f["tabla"], f["columna"]) for f in cursor.fetchall()}
        personas, talleres = {}, {}

        def agregar(destino, valor, multiple=False):
            for nombre in str(valor or "").split("|") if multiple else [str(valor or "")]:
                nombre = " ".join(nombre.split())
                if nombre:
                    destino.setdefault(nombre.casefold(), nombre)

        if ("operarios_planilla", "nombre_operario") in columnas:
            cursor.execute("SELECT DISTINCT nombre_operario, etapa FROM operarios_planilla")
            for fila in cursor.fetchall():
                agregar(talleres if str(fila["etapa"]).casefold() == "aparado" else personas, fila["nombre_operario"])
        for tabla, columna, multiple in [
            ("remitos", "recibido_por", False),
            ("recepcion_cortes", "controlador", False),
            ("produccion_diaria", "operario_calzado", True),
            ("produccion_diaria", "operario_puntera", True),
            ("produccion_diaria", "operario_inspeccion_final", True),
            ("produccion_diaria_bloque", "operario_inyeccion", True),
        ]:
            if (tabla, columna) in columnas:
                cursor.execute(f"SELECT DISTINCT {columna} AS nombre FROM {tabla}")
                for fila in cursor.fetchall():
                    agregar(personas, fila["nombre"], multiple)
        return jsonify({"personas": sorted(personas.values(), key=str.casefold), "talleres": sorted(talleres.values(), key=str.casefold)})
    finally:
        cursor.close()
        conn.close()
