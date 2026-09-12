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

        def agregar(destino, valor, fecha, multiple=False):
            for nombre in str(valor or "").split("|") if multiple else [str(valor or "")]:
                nombre = " ".join(nombre.split())
                if nombre:
                    clave = nombre.casefold()
                    reciente = str(fecha or "")
                    if clave not in destino or reciente > destino[clave][0]:
                        destino[clave] = (reciente, nombre)

        if ("operarios_planilla", "nombre_operario") in columnas:
            cursor.execute("""SELECT op.nombre_operario, op.etapa, p.fecha AS fecha
                FROM operarios_planilla op JOIN planilla_produccion p
                ON p.id_planilla=op.planilla_produccion_id_planilla ORDER BY p.fecha DESC, p.id_planilla DESC""")
            for fila in cursor.fetchall():
                agregar(talleres if str(fila["etapa"]).casefold() == "aparado" else personas, fila["nombre_operario"], fila["fecha"])
        for tabla, columna, multiple, origen, fecha, identificador in [
            ("remitos", "recibido_por", False, "remitos", "COALESCE(fecha_entrega,fecha_solicitud)", "id_remito"),
            ("recepcion_cortes", "controlador", False, "recepcion_cortes", "fecha", "id_recepcion"),
            ("produccion_diaria", "operario_calzado", True, "produccion_diaria", "fecha", "id_produccion_diaria"),
            ("produccion_diaria", "operario_puntera", True, "produccion_diaria", "fecha", "id_produccion_diaria"),
            ("produccion_diaria", "operario_inspeccion_final", True, "produccion_diaria", "fecha", "id_produccion_diaria"),
            ("produccion_diaria_bloque", "operario_inyeccion", True, "produccion_diaria_bloque b JOIN produccion_diaria d ON d.id_produccion_diaria=b.produccion_diaria_id", "d.fecha", "b.id_bloque"),
        ]:
            if (tabla, columna) in columnas:
                cursor.execute(f"SELECT {columna} AS nombre, {fecha} AS fecha FROM {origen} ORDER BY fecha DESC, {identificador} DESC")
                for fila in cursor.fetchall():
                    agregar(personas, fila["nombre"], fila["fecha"], multiple)
        def ultimos(valores):
            return [nombre for _, nombre in sorted(valores.values(), key=lambda item: item[0], reverse=True)[:5]]
        return jsonify({"personas": ultimos(personas), "talleres": ultimos(talleres)})
    finally:
        cursor.close()
        conn.close()
