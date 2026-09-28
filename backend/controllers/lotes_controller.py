from flask import jsonify, request
from db.connection import get_connection
from utils.db_helpers import responder_lista, responder_uno, responder_accion


def _asegurar_stock_lotes(cursor):
    for columna, definicion in (
        ("cantidad_descartada", "DECIMAL(10,2) NOT NULL DEFAULT 0"),
        ("lote_cerrado", "TINYINT(1) NOT NULL DEFAULT 0"),
        ("motivo_cierre", "VARCHAR(255) NULL"),
    ):
        cursor.execute("SHOW COLUMNS FROM lote_materiales LIKE %s", (columna,))
        if not cursor.fetchone():
            cursor.execute(f"ALTER TABLE lote_materiales ADD {columna} {definicion}")


def listar_lotes():
    respuesta, estado = responder_lista("sp_listar_lotes")
    if estado != 200:
        return respuesta, estado
    lotes = respuesta.get_json()
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    try:
        _asegurar_stock_lotes(cursor)
        cursor.execute("""
            SELECT l.id_lote,l.cantidad_descartada,l.lote_cerrado,l.motivo_cierre,
                   COALESCE(SUM(um.cantidad_usada),0) AS cantidad_usada
            FROM lote_materiales l
            LEFT JOIN uso_materiales um ON um.lote_materiales_id_lote=l.id_lote
            GROUP BY l.id_lote,l.cantidad_descartada,l.lote_cerrado,l.motivo_cierre
        """)
        estados = {int(fila["id_lote"]): fila for fila in cursor.fetchall()}
        for lote in lotes:
            estado_lote = estados.get(int(lote["id_lote"]), {})
            usado = float(estado_lote.get("cantidad_usada") or 0)
            descartado = float(estado_lote.get("cantidad_descartada") or 0)
            lote["cantidad_descartada"] = descartado
            lote["lote_cerrado"] = bool(estado_lote.get("lote_cerrado"))
            lote["motivo_cierre"] = estado_lote.get("motivo_cierre")
            lote["cantidad_usada"] = usado
            lote["cantidad_disponible"] = 0 if lote.get("lote_cerrado") else max(float(lote.get("cantidad_recibida") or 0) - usado - descartado, 0)
        return jsonify(lotes), 200
    finally:
        cursor.close(); conn.close()


def obtener_lote(id_lote):
    return responder_uno("sp_obtener_lote", (id_lote,))


def crear_lote():
    data = request.json or {}
    return responder_accion(
        "sp_crear_lote",
        (
            data.get("remitos_id_remito"),
            data.get("materiales_id_material"),
            data.get("colores_id_color") or None,
            data.get("codigo_lote"),
            data.get("cantidad_solicitada"),
            data.get("cantidad_recibida"),
            data.get("pendiente"),
            data.get("observaciones"),
        ),
        201,
    )


def actualizar_lote(id_lote):
    data = request.json or {}
    return responder_accion(
        "sp_actualizar_lote",
        (
            id_lote,
            data.get("remitos_id_remito"),
            data.get("materiales_id_material"),
            data.get("colores_id_color") or None,
            data.get("codigo_lote"),
            data.get("cantidad_solicitada"),
            data.get("cantidad_recibida"),
            data.get("pendiente"),
            data.get("observaciones"),
        ),
    )


def eliminar_lote(id_lote):
    return responder_accion("sp_eliminar_lote", (id_lote,))


def cambiar_estado_stock(id_lote):
    data = request.json or {}
    cerrar = bool(data.get("cerrar"))
    motivo = str(data.get("motivo") or "Remanente no utilizable").strip() or "Remanente no utilizable"
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    try:
        _asegurar_stock_lotes(cursor)
        cursor.execute("SELECT cantidad_recibida FROM lote_materiales WHERE id_lote=%s FOR UPDATE", (id_lote,))
        lote = cursor.fetchone()
        if not lote:
            return jsonify({"error": "Lote no encontrado."}), 404
        if cerrar:
            cursor.execute("SELECT COALESCE(SUM(cantidad_usada),0) AS usado FROM uso_materiales WHERE lote_materiales_id_lote=%s", (id_lote,))
            usado = float((cursor.fetchone() or {}).get("usado") or 0)
            remanente = max(float(lote.get("cantidad_recibida") or 0) - usado, 0)
            cursor.execute("UPDATE lote_materiales SET cantidad_descartada=%s,lote_cerrado=1,motivo_cierre=%s WHERE id_lote=%s", (remanente, motivo, id_lote))
        else:
            cursor.execute("UPDATE lote_materiales SET cantidad_descartada=0,lote_cerrado=0,motivo_cierre=NULL WHERE id_lote=%s", (id_lote,))
        conn.commit()
        return jsonify({"mensaje": "Lote cerrado." if cerrar else "Lote reabierto."}), 200
    except Exception as error:
        conn.rollback(); return jsonify({"error": str(error)}), 500
    finally:
        cursor.close(); conn.close()
