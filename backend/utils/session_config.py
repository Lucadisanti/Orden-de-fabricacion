"""Configuración explícita de la firma de sesiones, sin secretos incorporados."""

import os
import secrets


def configurar_clave_sesion(app):
    entorno = os.getenv("ORDEN_ENV", "production")
    es_test = os.getenv("TESTING") == "1"
    if entorno not in {"production", "development", "testing"}:
        raise RuntimeError("ORDEN_ENV debe ser production, development o testing.")
    if entorno == "testing" and not es_test:
        raise RuntimeError("El entorno testing requiere TESTING=1.")

    clave = os.getenv("FLASK_SECRET_KEY")
    if clave:
        if len(clave.encode("utf-8")) < 32 or clave.strip() != clave or len(set(clave)) < 8:
            raise RuntimeError("FLASK_SECRET_KEY debe ser una clave aleatoria de al menos 32 bytes, sin espacios externos.")
    elif es_test or entorno == "development":
        clave = secrets.token_hex(32)
    else:
        raise RuntimeError("Falta FLASK_SECRET_KEY: configure una clave aleatoria privada y persistente antes de iniciar producción.")

    app.config["SECRET_KEY"] = clave
