"""Autoría y última modificación de los registros de la API."""
from datetime import timezone

from flask import jsonify, request, session

from db.connection import get_connection


# Recursos con autoría y última actualización. Los subrecursos de una
# planilla actualizan la marca de la planilla; las líneas, la del día.
RECURSOS = {
    "materiales": "id_material", "maquinas": "id_maquina",
    "proveedores": "id_proveedor", "colores": "id_color",
    "productos": "id_producto", "ordenes": "id_orden",
    "remitos": "id_remito", "lotes": "id_lote",
    "planillas": "id_planilla", "uso-materiales": "id_uso",
    "recepcion-cortes": "id_recepcion",
    "produccion-diaria": "id_produccion_diaria",
    "modelos-calzado": "id_modelo", "punteras": "id_puntera",
    "adicionales": "id_adicional",
}


def asegurar_esquema(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS registro_autoria (
        recurso VARCHAR(50) NOT NULL, registro_id INT NOT NULL,
        usuario_id INT NOT NULL, autor VARCHAR(120) NOT NULL,
        creado_en DATETIME(6) NOT NULL,
        PRIMARY KEY (recurso, registro_id), KEY idx_autor (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS registro_actualizacion (
        recurso VARCHAR(50) NOT NULL, registro_id INT NOT NULL,
        usuario_id INT NOT NULL, usuario VARCHAR(120) NOT NULL,
        actualizado_en DATETIME(6) NOT NULL,
        PRIMARY KEY (recurso, registro_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")


def registrar_actualizacion(cursor, recurso, registro_id, usuario):
    cursor.execute("""INSERT INTO registro_actualizacion
        (recurso,registro_id,usuario_id,usuario,actualizado_en)
        VALUES (%s,%s,%s,%s,UTC_TIMESTAMP(6))
        ON DUPLICATE KEY UPDATE usuario_id=VALUES(usuario_id),
        usuario=VALUES(usuario), actualizado_en=VALUES(actualizado_en)""",
        (recurso, registro_id, usuario["id"], usuario["nombre"]))


def recurso_actual():
    partes = request.path.strip("/").split("/")
    if len(partes) < 2 or partes[0] != "api":
        return None, None, None
    recurso = partes[1]
    if recurso == "catalogos" and len(partes) > 2:
        recurso = partes[2]
        partes = ["api", recurso, *partes[3:]]
    if recurso not in RECURSOS:
        return None, None, None
    identificador = partes[2] if len(partes) > 2 else None
    if recurso == "produccion-diaria" and identificador == "linea" and len(partes) > 3:
        return recurso, "linea", partes[3]
    if recurso == "planillas" and identificador in {"detalles", "operarios"}:
        return recurso, identificador, partes[3] if len(partes) > 3 else None
    if recurso == "planillas" and identificador and identificador.isdigit() and len(partes) > 3 and partes[3] in {"detalles", "operarios"}:
        return recurso, "planilla-hija", identificador
    return recurso, "principal", identificador


def id_padre(cursor, recurso, tipo, identificador):
    if not identificador or not str(identificador).isdigit():
        return None
    if recurso == "produccion-diaria" and tipo == "linea":
        cursor.execute("""SELECT b.produccion_diaria_id AS id FROM produccion_diaria_linea l
            JOIN produccion_diaria_bloque b ON b.id_bloque=l.bloque_id WHERE l.id_linea=%s""", (identificador,))
        fila = cursor.fetchone()
        return fila["id"] if fila else None
    if recurso == "planillas" and tipo in {"detalles", "operarios"}:
        tabla, columna, clave = ("detalle_planilla", "planilla_produccion_id_planilla", "id_detalle") if tipo == "detalles" else ("operarios_planilla", "planilla_produccion_id_planilla", "id_operario_planilla")
        cursor.execute(f"SELECT {columna} AS id FROM {tabla} WHERE {clave}=%s", (identificador,))
        fila = cursor.fetchone()
        return fila["id"] if fila else None
    return int(identificador)


def autorizar_cambio():
    if request.method == "DELETE" and session["usuario"]["rol"] not in {"maestro", "admin"}:
        return jsonify({"error": "Solo un administrador puede eliminar registros."}), 403
    return None


def enriquecer_respuesta(response):
    recurso, tipo, identificador = recurso_actual()
    if not recurso or response.status_code >= 400 or not response.is_json:
        return response
    datos = response.get_json()
    if request.method == "POST" and isinstance(datos, dict):
        clave = RECURSOS[recurso]
        registro_id = datos.get(clave)
        if registro_id and tipo == "principal":
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                asegurar_esquema(cursor)
                usuario = session["usuario"]
                cursor.execute("""INSERT INTO registro_autoria (recurso,registro_id,usuario_id,autor,creado_en)
                    VALUES (%s,%s,%s,%s,UTC_TIMESTAMP(6))""", (recurso, registro_id, usuario["id"], usuario["nombre"]))
                if recurso == "ordenes" and datos.get("id_planilla"):
                    cursor.execute("""INSERT INTO registro_autoria (recurso,registro_id,usuario_id,autor,creado_en)
                        VALUES ('planillas',%s,%s,%s,UTC_TIMESTAMP(6))""", (datos["id_planilla"], usuario["id"], usuario["nombre"]))
                if recurso == "produccion-diaria":
                    for id_planilla in datos.get("planillas_creadas", []):
                        cursor.execute("""INSERT INTO registro_autoria (recurso,registro_id,usuario_id,autor,creado_en)
                            VALUES ('planillas',%s,%s,%s,UTC_TIMESTAMP(6))""", (id_planilla, usuario["id"], usuario["nombre"]))
                    for id_planilla in set(datos.get("planillas_afectadas_ids", [])) - set(datos.get("planillas_creadas", [])):
                        registrar_actualizacion(cursor, "planillas", id_planilla, usuario)
                conn.commit()
            finally:
                cursor.close()
                conn.close()
    if request.method in {"PUT", "PATCH"} or request.method == "POST" and tipo == "planilla-hija":
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            asegurar_esquema(cursor)
            registro_id = id_padre(cursor, recurso, tipo, identificador)
            if registro_id is not None:
                usuario = session["usuario"]
                registrar_actualizacion(cursor, recurso, registro_id, usuario)
                if recurso in {"ordenes", "produccion-diaria"} and datos.get("id_planilla"):
                    registrar_actualizacion(cursor, "planillas", datos["id_planilla"], usuario)
                conn.commit()
        finally:
            cursor.close()
            conn.close()
    if request.method != "GET" or tipo != "principal":
        return response
    filas = datos if isinstance(datos, list) else [datos] if isinstance(datos, dict) else []
    ids = [fila[RECURSOS[recurso]] for fila in filas if isinstance(fila, dict) and fila.get(RECURSOS[recurso]) is not None]
    if not ids:
        return response
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        asegurar_esquema(cursor)
        marcas = ",".join(["%s"] * len(ids))
        cursor.execute(f"SELECT registro_id,usuario_id,autor,creado_en FROM registro_autoria WHERE recurso=%s AND registro_id IN ({marcas})", (recurso, *ids))
        autoria = {fila["registro_id"]: fila for fila in cursor.fetchall()}
        cursor.execute(f"""SELECT registro_id,usuario,actualizado_en FROM registro_actualizacion
            WHERE recurso=%s AND registro_id IN ({marcas})""", (recurso, *ids))
        actualizaciones = {fila["registro_id"]: fila for fila in cursor.fetchall()}
        if recurso == "uso-materiales":
            sin_autor = [registro_id for registro_id in ids if registro_id not in autoria]
            if sin_autor:
                marcas_faltantes = ",".join(["%s"] * len(sin_autor))
                cursor.execute(f"""SELECT u.id_uso AS registro_id,a.usuario_id,a.autor,a.creado_en
                    FROM uso_materiales u JOIN registro_autoria a
                      ON a.recurso='planillas' AND a.registro_id=u.planilla_produccion_id_planilla
                    WHERE u.id_uso IN ({marcas_faltantes})""", tuple(sin_autor))
                autoria.update({fila["registro_id"]: fila for fila in cursor.fetchall()})
        for fila in filas:
            dato = autoria.get(fila.get(RECURSOS[recurso]))
            actualizacion = actualizaciones.get(fila.get(RECURSOS[recurso]))
            fila["autor"] = dato["autor"] if dato else None
            fila["creado_en"] = dato["creado_en"].replace(tzinfo=timezone.utc).isoformat() if dato else None
            fila["autor_id"] = dato["usuario_id"] if dato else None
            fila["actualizado_por"] = actualizacion["usuario"] if actualizacion else None
            fila["actualizado_en"] = actualizacion["actualizado_en"].replace(tzinfo=timezone.utc).isoformat() if actualizacion else None
        response.set_data(jsonify(datos).get_data())
    finally:
        cursor.close()
        conn.close()
    return response
