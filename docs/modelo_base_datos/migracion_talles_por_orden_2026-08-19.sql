USE orden_fabricacion;

CREATE TABLE IF NOT EXISTS detalle_orden (
  id_detalle_orden INT AUTO_INCREMENT PRIMARY KEY,
  orden_fabricacion_id_orden INT NOT NULL,
  talle VARCHAR(10) NOT NULL,
  cantidad_pares INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_detalle_orden_talle (orden_fabricacion_id_orden, talle),
  KEY idx_detalle_orden_orden (orden_fabricacion_id_orden),
  CONSTRAINT fk_detalle_orden_orden
    FOREIGN KEY (orden_fabricacion_id_orden)
    REFERENCES orden_fabricacion (id_orden)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conserva un objetivo inicial para órdenes históricas usando su planilla de Corte.
-- Solo se completa cuando la orden todavía no tiene planificación propia.
INSERT INTO detalle_orden (orden_fabricacion_id_orden, talle, cantidad_pares)
SELECT
  pp.orden_fabricacion_id_orden,
  dp.talle,
  SUM(dp.cantidad_pares)
FROM planilla_produccion pp
INNER JOIN detalle_planilla dp
  ON dp.planilla_produccion_id_planilla = pp.id_planilla
WHERE LOWER(pp.tipo_planilla) = 'corte'
  AND NOT EXISTS (
    SELECT 1
    FROM detalle_orden existente
    WHERE existente.orden_fabricacion_id_orden = pp.orden_fabricacion_id_orden
  )
GROUP BY pp.orden_fabricacion_id_orden, dp.talle;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_listar_ordenes$$
CREATE PROCEDURE sp_listar_ordenes()
BEGIN
  SELECT
    o.id_orden,
    o.numero_orden,
    o.fecha,
    o.producto_id_producto,
    p.articulo_producto,
    p.nombre_producto AS producto,
    c.color,
    COALESCE(MAX(totales.total_pares), 0) AS total_pares,
    CASE
      WHEN COUNT(pp.id_planilla) = 0 THEN 'Pendiente'
      WHEN SUM(CASE WHEN LOWER(pp.estado) IN ('finalizada', 'finalizado') THEN 1 ELSE 0 END) = COUNT(pp.id_planilla) THEN 'Finalizada'
      WHEN SUM(CASE WHEN LOWER(pp.estado) IN ('en proceso', 'en producción', 'en produccion') THEN 1 ELSE 0 END) > 0 THEN 'En producción'
      ELSE 'Pendiente'
    END AS estado
  FROM orden_fabricacion o
  INNER JOIN producto p ON o.producto_id_producto = p.id_producto
  LEFT JOIN colores c ON p.colores_id_color = c.id_color
  LEFT JOIN planilla_produccion pp ON pp.orden_fabricacion_id_orden = o.id_orden
  LEFT JOIN (
    SELECT orden_fabricacion_id_orden, SUM(cantidad_pares) AS total_pares
    FROM detalle_orden
    GROUP BY orden_fabricacion_id_orden
  ) totales ON totales.orden_fabricacion_id_orden = o.id_orden
  GROUP BY o.id_orden, o.numero_orden, o.fecha, o.producto_id_producto,
           p.articulo_producto, p.nombre_producto, c.color
  ORDER BY o.fecha DESC, o.id_orden DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_orden$$
CREATE PROCEDURE sp_obtener_orden(IN p_id_orden INT)
BEGIN
  SELECT
    o.id_orden,
    o.numero_orden,
    o.fecha,
    o.producto_id_producto,
    p.articulo_producto,
    p.nombre_producto AS producto,
    c.color,
    COALESCE(SUM(d.cantidad_pares), 0) AS total_pares
  FROM orden_fabricacion o
  INNER JOIN producto p ON o.producto_id_producto = p.id_producto
  LEFT JOIN colores c ON p.colores_id_color = c.id_color
  LEFT JOIN detalle_orden d ON d.orden_fabricacion_id_orden = o.id_orden
  WHERE o.id_orden = p_id_orden
  GROUP BY o.id_orden, o.numero_orden, o.fecha, o.producto_id_producto,
           p.articulo_producto, p.nombre_producto, c.color;
END$$

DROP PROCEDURE IF EXISTS sp_listar_talles_orden$$
CREATE PROCEDURE sp_listar_talles_orden(IN p_id_orden INT)
BEGIN
  SELECT id_detalle_orden, orden_fabricacion_id_orden, talle, cantidad_pares
  FROM detalle_orden
  WHERE orden_fabricacion_id_orden = p_id_orden
  ORDER BY CAST(talle AS UNSIGNED), talle;
END$$

DELIMITER ;
