"""Cabeceras de respuestas de la API, sin modificar sus datos ni permisos."""

from flask import request


def aplicar_cabeceras_api(response):
    if request.path.startswith("/api/"):
        # Incluye identidad, códigos de recuperación y respuestas de error.
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
    return response
