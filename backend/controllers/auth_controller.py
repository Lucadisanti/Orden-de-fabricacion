import hashlib
import hmac
import secrets

from flask import jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from db.connection import get_connection


ROLES_GESTION = {"maestro", "admin"}


def _usuarios(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario INT AUTO_INCREMENT PRIMARY KEY, usuario VARCHAR(60) NOT NULL UNIQUE,
      nombre VARCHAR(120) NOT NULL, password_hash VARCHAR(255) NOT NULL,
      rol ENUM('maestro','admin','empleado') NOT NULL DEFAULT 'empleado',
      activo TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")


def _recuperacion(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS recuperacion_admin (
      id_usuario INT NOT NULL PRIMARY KEY,
      codigo_hash CHAR(64) NOT NULL,
      creado_en DATETIME(6) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")


def _migraciones(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS migraciones_sistema (
      clave VARCHAR(100) NOT NULL PRIMARY KEY,
      aplicado_en DATETIME(6) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")


def _actor():
    return session.get("usuario") or {}


def configurar_admin():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        _usuarios(cur)
        _migraciones(cur)
        cur.execute("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('maestro','admin','empleado') NOT NULL DEFAULT 'empleado'")
        cur.execute("SELECT COUNT(*) AS cantidad FROM usuarios")
        if not cur.fetchone()["cantidad"]:
            cur.execute("INSERT INTO usuarios (usuario,nombre,password_hash,rol) VALUES (%s,%s,%s,'maestro')", ("Admin", "Administrador maestro", generate_password_hash("Admin1234")))
        cur.execute("SELECT id_usuario FROM usuarios WHERE BINARY usuario='Admin'")
        if not cur.fetchone():
            cur.execute("UPDATE usuarios SET usuario='Admin' WHERE BINARY usuario='admin'")
        cur.execute("UPDATE usuarios SET rol='maestro' WHERE BINARY usuario='Admin'")
        cur.execute("SELECT clave FROM migraciones_sistema WHERE clave='usuarios_iniciales_v1'")
        if not cur.fetchone():
            # Esta carga se ejecuta una sola vez por base de datos. INSERT IGNORE
            # preserva cualquier cuenta previa con el mismo usuario.
            for usuario, nombre, rol in (
                ("Admin", "Administrador maestro", "maestro"),
                ("Ariel_disanti@bohm.com", "Ariel Disanti", "admin"),
                ("Usuario", "Usuario", "empleado"),
            ):
                cur.execute(
                    "INSERT IGNORE INTO usuarios (usuario,nombre,password_hash,rol) VALUES (%s,%s,%s,%s)",
                    (usuario, nombre, generate_password_hash("Admin1234"), rol),
                )
            cur.execute("INSERT INTO migraciones_sistema (clave,aplicado_en) VALUES ('usuarios_iniciales_v1',UTC_TIMESTAMP(6))")
        conn.commit()
    finally:
        cur.close()
        conn.close()


def iniciar_sesion():
    datos = request.get_json(silent=True) or {}
    usuario = str(datos.get("usuario", "")).strip()
    clave = str(datos.get("contrasena", ""))
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        _usuarios(cur)
        cur.execute("SELECT * FROM usuarios WHERE BINARY usuario=%s", (usuario,))
        fila = cur.fetchone()
        if not fila or not fila["activo"] or not check_password_hash(fila["password_hash"], clave):
            return jsonify({"error": "Usuario o contraseña incorrectos."}), 401
        session.clear()
        session["usuario"] = {"id": fila["id_usuario"], "usuario": fila["usuario"], "nombre": fila["nombre"], "rol": fila["rol"]}
        return jsonify(session["usuario"])
    finally:
        cur.close()
        conn.close()


def sesion_actual():
    return jsonify(session.get("usuario")) if session.get("usuario") else (jsonify({"error": "Sesión requerida."}), 401)


def cerrar_sesion():
    session.clear()
    return "", 204


def listar_usuarios():
    actor = _actor()
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        _usuarios(cur)
        _recuperacion(cur)
        consulta = """SELECT u.id_usuario,u.usuario,u.nombre,u.rol,u.activo,
          r.id_usuario IS NOT NULL AS tiene_recuperacion
          FROM usuarios u LEFT JOIN recuperacion_admin r ON r.id_usuario=u.id_usuario"""
        if actor["rol"] == "maestro":
            cur.execute(f"{consulta} ORDER BY FIELD(u.rol,'maestro','admin','empleado'),u.usuario")
        else:
            cur.execute(f"{consulta} WHERE u.rol='empleado' OR u.id_usuario=%s ORDER BY u.usuario", (actor["id"],))
        return jsonify(cur.fetchall())
    finally:
        cur.close()
        conn.close()


def generar_codigo_recuperacion(id_usuario):
    if _actor().get("rol") != "maestro":
        return jsonify({"error": "Solo la cuenta maestra puede gestionar códigos de recuperación."}), 403
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        _usuarios(cur)
        _recuperacion(cur)
        cur.execute("SELECT usuario FROM usuarios WHERE id_usuario=%s AND rol='maestro' AND activo=1", (id_usuario,))
        fila = cur.fetchone()
        if not fila:
            return jsonify({"error": "No se encontró una cuenta maestra activa."}), 404
        codigo = secrets.token_urlsafe(24)
        codigo_hash = hashlib.sha256(codigo.encode("utf-8")).hexdigest()
        cur.execute("""INSERT INTO recuperacion_admin (id_usuario,codigo_hash,creado_en)
          VALUES (%s,%s,UTC_TIMESTAMP(6))
          ON DUPLICATE KEY UPDATE codigo_hash=VALUES(codigo_hash),creado_en=VALUES(creado_en)""", (id_usuario, codigo_hash))
        conn.commit()
        return jsonify({"usuario": fila["usuario"], "codigo": codigo})
    finally:
        cur.close()
        conn.close()


def recuperar_contrasena():
    datos = request.get_json(silent=True) or {}
    usuario = str(datos.get("usuario", "")).strip()
    codigo = str(datos.get("codigo", "")).strip()
    contrasena = str(datos.get("contrasena", ""))
    if not usuario or not codigo or len(contrasena) < 8:
        return jsonify({"error": "Ingresá usuario, código y una contraseña nueva de al menos 8 caracteres."}), 400
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        _usuarios(cur)
        _recuperacion(cur)
        cur.execute("""SELECT u.id_usuario,u.rol,u.activo,r.codigo_hash
          FROM usuarios u LEFT JOIN recuperacion_admin r ON r.id_usuario=u.id_usuario
          WHERE BINARY u.usuario=%s FOR UPDATE""", (usuario,))
        fila = cur.fetchone()
        esperado = fila["codigo_hash"] if fila and fila["codigo_hash"] else "0" * 64
        valido = hmac.compare_digest(hashlib.sha256(codigo.encode("utf-8")).hexdigest(), esperado)
        if not fila or fila["rol"] != "maestro" or not fila["activo"] or not valido:
            return jsonify({"error": "Usuario o código de recuperación inválido."}), 400
        cur.execute("UPDATE usuarios SET password_hash=%s WHERE id_usuario=%s", (generate_password_hash(contrasena), fila["id_usuario"]))
        cur.execute("DELETE FROM recuperacion_admin WHERE id_usuario=%s", (fila["id_usuario"],))
        conn.commit()
        session.clear()
        return jsonify({"mensaje": "Contraseña actualizada. El código ya no puede volver a usarse."})
    finally:
        cur.close()
        conn.close()


def crear_usuario():
    actor = _actor()
    datos = request.get_json() or {}
    usuario = str(datos.get("usuario", "")).strip()
    nombre = str(datos.get("nombre", "")).strip() or usuario
    contrasena = str(datos.get("contrasena", ""))
    rol = datos.get("rol", "empleado")
    roles_permitidos = {"admin", "empleado"} if actor["rol"] == "maestro" else {"empleado"}
    if len(usuario) < 3 or len(contrasena) < 8 or rol not in roles_permitidos:
        return jsonify({"error": "No tenés permiso para crear ese tipo de usuario o los datos son inválidos."}), 400
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        _usuarios(cur)
        cur.execute("INSERT INTO usuarios(usuario,nombre,password_hash,rol) VALUES(%s,%s,%s,%s)", (usuario, nombre, generate_password_hash(contrasena), rol))
        conn.commit()
        return jsonify({"mensaje": "Usuario creado."}), 201
    except Exception:
        conn.rollback()
        return jsonify({"error": "Ese usuario ya existe."}), 409
    finally:
        cur.close()
        conn.close()


def actualizar_usuario(id_usuario):
    actor = _actor()
    datos = request.get_json() or {}
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        _usuarios(cur)
        cur.execute("SELECT id_usuario,rol,password_hash FROM usuarios WHERE id_usuario=%s", (id_usuario,))
        destino = cur.fetchone()
        if not destino:
            return jsonify({"error": "Usuario no encontrado."}), 404
        es_propio = destino["id_usuario"] == actor["id"]
        puede_modificar = actor["rol"] == "maestro" or (actor["rol"] == "admin" and (destino["rol"] == "empleado" or es_propio))
        if not puede_modificar:
            return jsonify({"error": "No tenés permiso para modificar esta cuenta."}), 403
        if "usuario" in datos:
            usuario = str(datos["usuario"]).strip()
            if len(usuario) < 3:
                return jsonify({"error": "El usuario debe tener al menos 3 caracteres."}), 400
            cur.execute("UPDATE usuarios SET usuario=%s WHERE id_usuario=%s", (usuario, id_usuario))
        if "nombre" in datos and str(datos["nombre"]).strip():
            cur.execute("UPDATE usuarios SET nombre=%s WHERE id_usuario=%s", (str(datos["nombre"]).strip(), id_usuario))
        if "rol" in datos:
            nuevo_rol = datos["rol"]
            if actor["rol"] != "maestro" or destino["rol"] == "maestro" or nuevo_rol not in {"admin", "empleado"}:
                return jsonify({"error": "No tenés permiso para cambiar este rol."}), 403
            cur.execute("UPDATE usuarios SET rol=%s WHERE id_usuario=%s", (nuevo_rol, id_usuario))
        if "contrasena" in datos and datos["contrasena"]:
            if len(str(datos["contrasena"])) < 8:
                return jsonify({"error": "La contraseña debe tener al menos 8 caracteres."}), 400
            if es_propio and not check_password_hash(destino["password_hash"], str(datos.get("contrasena_actual", ""))):
                return jsonify({"error": "La contraseña actual es incorrecta."}), 400
            cur.execute("UPDATE usuarios SET password_hash=%s WHERE id_usuario=%s", (generate_password_hash(str(datos["contrasena"])), id_usuario))
        if "activo" in datos:
            if es_propio:
                return jsonify({"error": "No podés desactivar tu propia cuenta."}), 400
            cur.execute("UPDATE usuarios SET activo=%s WHERE id_usuario=%s", (bool(datos["activo"]), id_usuario))
        conn.commit()
        return jsonify({"mensaje": "Usuario actualizado."})
    except Exception:
        conn.rollback()
        return jsonify({"error": "No se pudo actualizar el usuario. Verificá que el nombre de usuario no esté repetido."}), 409
    finally:
        cur.close()
        conn.close()


def eliminar_usuario(id_usuario):
    actor = _actor()
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        _usuarios(cur)
        cur.execute("SELECT id_usuario,rol FROM usuarios WHERE id_usuario=%s", (id_usuario,))
        destino = cur.fetchone()
        if not destino:
            return jsonify({"error": "Usuario no encontrado."}), 404
        es_propio = destino["id_usuario"] == actor["id"]
        puede_eliminar = not es_propio and (
            (actor["rol"] == "maestro" and destino["rol"] != "maestro")
            or (actor["rol"] == "admin" and destino["rol"] == "empleado")
        )
        if not puede_eliminar:
            return jsonify({"error": "No tenés permiso para eliminar esta cuenta."}), 403
        _recuperacion(cur)
        cur.execute("DELETE FROM recuperacion_admin WHERE id_usuario=%s", (id_usuario,))
        cur.execute("DELETE FROM usuarios WHERE id_usuario=%s", (id_usuario,))
        conn.commit()
        return jsonify({"mensaje": "Usuario eliminado."})
    finally:
        cur.close()
        conn.close()
