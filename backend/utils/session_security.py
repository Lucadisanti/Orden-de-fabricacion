"""Sesiones vinculadas a la cuenta vigente, sin cambios de esquema."""

import hashlib
import hmac

from flask import current_app, jsonify, session

from db.connection import get_connection


def huella_credencial(password_hash):
    clave = current_app.secret_key
    if isinstance(clave, str):
        clave = clave.encode("utf-8")
    return hmac.new(clave, b"credencial-sesion-v1\0" + password_hash.encode("utf-8"), hashlib.sha256).hexdigest()


def identidad_usuario(fila):
    return {"id": fila["id_usuario"], "usuario": fila["usuario"], "nombre": fila["nombre"], "rol": fila["rol"]}


def establecer_sesion(fila):
    session.clear()
    session["usuario"] = identidad_usuario(fila)
    # La cookie contiene una huella HMAC, nunca el hash de la contraseña.
    session["_credencial"] = huella_credencial(fila["password_hash"])


def _consultar_usuario(usuario_id):
    conexion = get_connection()
    cursor = None
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT id_usuario,usuario,nombre,rol,activo,password_hash FROM usuarios WHERE id_usuario=%s", (usuario_id,))
        return cursor.fetchone()
    finally:
        try:
            if cursor is not None:
                cursor.close()
        finally:
            conexion.close()


def revalidar_sesion():
    identidad = session.get("usuario")
    firma = session.get("_credencial")
    if not isinstance(identidad, dict) or type(identidad.get("id")) is not int or identidad["id"] <= 0 or not isinstance(firma, str) or len(firma) != 64 or any(caracter not in "0123456789abcdef" for caracter in firma):
        session.clear()
        return jsonify({"error": "Sesión requerida."}), 401

    try:
        fila = _consultar_usuario(identidad["id"])
    except Exception:
        # Una falla transitoria no autoriza la operación ni borra una sesión válida.
        return jsonify({"error": "No se pudo comprobar la sesión. Intentá nuevamente."}), 503

    if not fila or not fila["activo"] or fila["rol"] not in {"maestro", "admin", "empleado"} or not hmac.compare_digest(firma, huella_credencial(fila["password_hash"])):
        session.clear()
        return jsonify({"error": "La sesión venció. Iniciá sesión nuevamente."}), 401

    session["usuario"] = identidad_usuario(fila)
    return None
