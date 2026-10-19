"""Run inside the backend container with: python - USERNAME."""

import os
import secrets
import sys

import mysql.connector
from werkzeug.security import generate_password_hash


def main():
    username = sys.argv[1].strip() if len(sys.argv) > 1 else ""
    if not username:
        raise SystemExit("Indique el usuario administrador.")

    connection = mysql.connector.connect(
        host=os.environ["DB_HOST"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        port=int(os.environ.get("DB_PORT", "3306")),
    )
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE BINARY usuario=%s AND rol='maestro' AND activo=1",
            (username,),
        )
        row = cursor.fetchone()
        if not row:
            raise SystemExit("No existe un administrador activo con ese usuario.")

        password = secrets.token_urlsafe(18)
        cursor.execute(
            "UPDATE usuarios SET password_hash=%s WHERE id_usuario=%s",
            (generate_password_hash(password), row["id_usuario"]),
        )
        # Older installations may not have this table yet.
        cursor.execute("SHOW TABLES LIKE 'recuperacion_admin'")
        if cursor.fetchone():
            cursor.execute(
                "DELETE FROM recuperacion_admin WHERE id_usuario=%s",
                (row["id_usuario"],),
            )
        connection.commit()
        print("Usuario:", username)
        print("Nueva contrasena temporal:", password)
        print("Ingrese al sistema y cambie esta contrasena desde Usuarios.")
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
