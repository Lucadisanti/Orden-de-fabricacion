from flask import request, jsonify
from db.connection import get_connection

def listar_productos():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                p.id_producto,
                p.articulo_producto,
                p.nombre_producto,
                p.colores_id_color,
                c.color
            FROM producto p
            LEFT JOIN colores c 
            ON p.colores_id_color = c.id_color
        """
        cursor.execute(query)
        productos = cursor.fetchall()

        print("PRODUCTOS:", productos)

        cursor.close()
        conn.close()

        return jsonify(productos), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def crear_producto():
    try:
        data = request.json

        articulo_producto = data.get("articulo_producto")
        nombre_producto = data.get("nombre_producto")
        colores_id_color = data.get("colores_id_color")

        conn = get_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO producto 
            (articulo_producto, nombre_producto, colores_id_color)
            VALUES (%s, %s, %s)
        """

        cursor.execute(query, (
            articulo_producto,
            nombre_producto,
            colores_id_color
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"mensaje": "Producto creado correctamente"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500