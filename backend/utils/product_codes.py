def recalcular_articulos(cursor):
    cursor.execute(
        """
        SELECT p.id_producto,
          CONCAT(m.codigo_modelo, pu.codigo_puntera,
            COALESCE(GROUP_CONCAT(a.codigo_adicional ORDER BY pa.orden SEPARATOR ''), ''),
            c.codigo_color) AS articulo
        FROM producto p
        INNER JOIN modelos_calzado m ON m.id_modelo = p.modelos_calzado_id_modelo
        INNER JOIN punteras pu ON pu.id_puntera = p.punteras_id_puntera
        INNER JOIN colores c ON c.id_color = p.colores_id_color
        LEFT JOIN producto_adicionales pa ON pa.producto_id_producto = p.id_producto
        LEFT JOIN adicionales a ON a.id_adicional = pa.adicionales_id_adicional
        GROUP BY p.id_producto, m.codigo_modelo, pu.codigo_puntera, c.codigo_color
        """
    )
    articulos = cursor.fetchall()
    cursor.executemany(
        "UPDATE producto SET articulo_producto = %s WHERE id_producto = %s",
        [(articulo, id_producto) for id_producto, articulo in articulos],
    )
