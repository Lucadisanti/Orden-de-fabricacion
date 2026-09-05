from flask import jsonify, request

from db.connection import get_connection
from utils.db_helpers import responder_lista, responder_uno
from utils.forced_deletes import eliminar_orden as eliminar_orden_forzada, responder_borrado_forzado, responder_borrado_simple


def _normalizar_talles(talles):
    resultado, vistos = [], set()
    for item in talles or []:
        talle = str(item.get("talle", "")).strip()
        try: cantidad = int(item.get("cantidad_pares") or 0)
        except (TypeError, ValueError): cantidad = 0
        if talle and cantidad > 0 and talle not in vistos:
            vistos.add(talle); resultado.append((talle, cantidad))
    return resultado


def _normalizar_materiales(materiales):
    resultado = []
    for valor in materiales or []:
        try: valor = int(valor)
        except (TypeError, ValueError): continue
        if valor > 0 and valor not in resultado: resultado.append(valor)
    return resultado


def _guardar_talles(cursor, id_orden, talles):
    cursor.execute("DELETE FROM detalle_orden WHERE orden_fabricacion_id_orden=%s", (id_orden,))
    if talles:
        cursor.executemany("INSERT INTO detalle_orden (orden_fabricacion_id_orden,talle,cantidad_pares) VALUES (%s,%s,%s)", [(id_orden, talle, cantidad) for talle, cantidad in talles])


def _guardar_r013(cursor, id_orden, fecha, data):
    cursor.execute("SELECT id_planilla FROM planilla_produccion WHERE orden_fabricacion_id_orden=%s AND (UPPER(numero_planilla)='R013' OR tipo_planilla='Corte y Aparado') ORDER BY id_planilla LIMIT 1", (id_orden,))
    planilla = cursor.fetchone()
    if planilla:
        id_planilla = planilla["id_planilla"]
        cursor.execute("UPDATE planilla_produccion SET numero_planilla='R013',fecha=%s,tipo_planilla='Corte y Aparado',maquinas_id_maquina=NULL WHERE id_planilla=%s", (fecha, id_planilla))
    else:
        cursor.execute("INSERT INTO planilla_produccion (orden_fabricacion_id_orden,numero_planilla,fecha,tipo_planilla,maquinas_id_maquina,estado) VALUES (%s,'R013',%s,'Corte y Aparado',NULL,'Pendiente')", (id_orden, fecha)); id_planilla = cursor.lastrowid
    cursor.execute("DELETE FROM operarios_planilla WHERE planilla_produccion_id_planilla=%s", (id_planilla,))
    operarios = [("Corte", str(data.get("operario_corte") or "").strip(), id_planilla), ("Aparado", str(data.get("operario_aparado") or "").strip(), id_planilla)]
    cursor.executemany("INSERT INTO operarios_planilla (etapa,nombre_operario,planilla_produccion_id_planilla) VALUES (%s,%s,%s)", [x for x in operarios if x[1]])
    cursor.execute("DELETE FROM uso_materiales WHERE planilla_produccion_id_planilla=%s", (id_planilla,))
    materiales = _normalizar_materiales(data.get("materiales"))
    if materiales: cursor.executemany("INSERT INTO uso_materiales (lote_materiales_id_lote,planilla_produccion_id_planilla,cantidad_usada) VALUES (%s,%s,0)", [(x, id_planilla) for x in materiales])
    return id_planilla


def listar_ordenes(): return responder_lista("sp_listar_ordenes")
def obtener_orden(id_orden): return responder_uno("sp_obtener_orden", (id_orden,))
def listar_talles_orden(id_orden): return responder_lista("sp_listar_talles_orden", (id_orden,))


def _guardar_orden(id_orden=None):
    data = request.json or {}; talles = _normalizar_talles(data.get("talles")); materiales = _normalizar_materiales(data.get("materiales"))
    if not talles: return jsonify({"error": "Debe cargar al menos un talle con cantidad."}), 400
    if not str(data.get("operario_corte") or "").strip(): return jsonify({"error": "Debe indicar el operario de corte."}), 400
    if not materiales: return jsonify({"error": "Debe seleccionar al menos un material utilizado."}), 400
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    try:
        valores = (data.get("producto_id_producto"), data.get("numero_orden"), data.get("fecha"))
        if id_orden: cursor.execute("UPDATE orden_fabricacion SET producto_id_producto=%s,numero_orden=%s,fecha=%s WHERE id_orden=%s", (*valores, id_orden))
        else: cursor.execute("INSERT INTO orden_fabricacion (producto_id_producto,numero_orden,fecha) VALUES (%s,%s,%s)", valores); id_orden = cursor.lastrowid
        _guardar_talles(cursor, id_orden, talles); id_planilla = _guardar_r013(cursor, id_orden, data.get("fecha"), data); conn.commit()
        return jsonify({"id_orden": id_orden, "id_planilla": id_planilla, "mensaje": "Orden guardada correctamente"}), 201 if request.method == "POST" else 200
    except Exception as error: conn.rollback(); return jsonify({"error": str(error)}), 500
    finally: cursor.close(); conn.close()


def crear_orden(): return _guardar_orden()
def actualizar_orden(id_orden): return _guardar_orden(id_orden)
def eliminar_orden(id_orden):
    if request.args.get("forzar") == "1": return responder_borrado_forzado(eliminar_orden_forzada, id_orden, "orden")
    return responder_borrado_simple("orden_fabricacion", "id_orden", id_orden, "orden")
