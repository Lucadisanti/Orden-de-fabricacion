USE orden_fabricacion;

ALTER TABLE colores ADD COLUMN codigo_color CHAR(2) NULL AFTER color;
ALTER TABLE colores ADD UNIQUE KEY uq_colores_codigo (codigo_color);

CREATE TABLE modelos_calzado (
  id_modelo INT AUTO_INCREMENT PRIMARY KEY,
  codigo_modelo CHAR(3) NOT NULL,
  nombre_modelo VARCHAR(80) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_modelos_codigo (codigo_modelo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE punteras (
  id_puntera INT AUTO_INCREMENT PRIMARY KEY,
  codigo_puntera CHAR(2) NOT NULL,
  nombre_puntera VARCHAR(80) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_punteras_codigo (codigo_puntera)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE adicionales (
  id_adicional INT AUTO_INCREMENT PRIMARY KEY,
  codigo_adicional CHAR(2) NOT NULL,
  nombre_adicional VARCHAR(80) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_adicionales_codigo (codigo_adicional)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE producto
  ADD COLUMN modelos_calzado_id_modelo INT NULL AFTER nombre_producto,
  ADD COLUMN punteras_id_puntera INT NULL AFTER modelos_calzado_id_modelo,
  ADD KEY idx_producto_modelo (modelos_calzado_id_modelo),
  ADD KEY idx_producto_puntera (punteras_id_puntera),
  ADD CONSTRAINT fk_producto_modelo FOREIGN KEY (modelos_calzado_id_modelo)
    REFERENCES modelos_calzado (id_modelo) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_producto_puntera FOREIGN KEY (punteras_id_puntera)
    REFERENCES punteras (id_puntera) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE producto_adicionales (
  producto_id_producto INT NOT NULL,
  adicionales_id_adicional INT NOT NULL,
  orden INT NOT NULL,
  PRIMARY KEY (producto_id_producto, adicionales_id_adicional),
  UNIQUE KEY uq_producto_adicional_orden (producto_id_producto, orden),
  CONSTRAINT fk_producto_adicional_producto FOREIGN KEY (producto_id_producto)
    REFERENCES producto (id_producto) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_producto_adicional FOREIGN KEY (adicionales_id_adicional)
    REFERENCES adicionales (id_adicional) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO punteras (codigo_puntera, nombre_puntera) VALUES
  ('01', 'Acero'),
  ('02', 'Composite'),
  ('03', 'Plastico');

INSERT INTO adicionales (codigo_adicional, nombre_adicional)
VALUES ('97', 'Excentrico metal');

UPDATE colores SET codigo_color = '06' WHERE LOWER(TRIM(color)) = 'negro';
UPDATE colores SET codigo_color = '09' WHERE LOWER(TRIM(color)) IN ('marron', 'marrón');

INSERT INTO modelos_calzado (codigo_modelo, nombre_modelo)
SELECT LEFT(articulo_producto, 3), MIN(nombre_producto)
FROM producto
WHERE articulo_producto REGEXP '^[0-9]{7,}$'
GROUP BY LEFT(articulo_producto, 3);

UPDATE producto p
INNER JOIN modelos_calzado m ON m.codigo_modelo = LEFT(p.articulo_producto, 3)
SET p.modelos_calzado_id_modelo = m.id_modelo
WHERE p.articulo_producto REGEXP '^[0-9]{7,}$';

UPDATE producto p
INNER JOIN punteras pu ON pu.codigo_puntera = SUBSTRING(p.articulo_producto, 4, 2)
SET p.punteras_id_puntera = pu.id_puntera
WHERE p.articulo_producto REGEXP '^[0-9]{7,}$';

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_listar_modelos_calzado$$
CREATE PROCEDURE sp_listar_modelos_calzado()
BEGIN
  SELECT id_modelo, codigo_modelo, nombre_modelo, activo
  FROM modelos_calzado WHERE activo = 1 ORDER BY codigo_modelo;
END$$

DROP PROCEDURE IF EXISTS sp_listar_punteras$$
CREATE PROCEDURE sp_listar_punteras()
BEGIN
  SELECT id_puntera, codigo_puntera, nombre_puntera, activo
  FROM punteras WHERE activo = 1 ORDER BY codigo_puntera;
END$$

DROP PROCEDURE IF EXISTS sp_listar_adicionales$$
CREATE PROCEDURE sp_listar_adicionales()
BEGIN
  SELECT id_adicional, codigo_adicional, nombre_adicional, activo
  FROM adicionales WHERE activo = 1 ORDER BY codigo_adicional;
END$$

DROP PROCEDURE IF EXISTS sp_listar_colores$$
CREATE PROCEDURE sp_listar_colores()
BEGIN
  SELECT id_color, color, codigo_color FROM colores ORDER BY color;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_color$$
CREATE PROCEDURE sp_obtener_color(IN p_id_color INT)
BEGIN
  SELECT id_color, color, codigo_color FROM colores WHERE id_color = p_id_color;
END$$

DROP PROCEDURE IF EXISTS sp_crear_color$$
CREATE PROCEDURE sp_crear_color(IN p_color VARCHAR(45), IN p_codigo_color CHAR(2))
BEGIN
  INSERT INTO colores (color, codigo_color) VALUES (p_color, p_codigo_color);
  SELECT LAST_INSERT_ID() AS id_color, 'Color creado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_color$$
CREATE PROCEDURE sp_actualizar_color(IN p_id_color INT, IN p_color VARCHAR(45), IN p_codigo_color CHAR(2))
BEGIN
  UPDATE colores SET color = p_color, codigo_color = p_codigo_color WHERE id_color = p_id_color;
  SELECT ROW_COUNT() AS filas_afectadas, 'Color actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_listar_productos$$
CREATE PROCEDURE sp_listar_productos()
BEGIN
  SELECT p.id_producto, p.articulo_producto, p.nombre_producto,
    p.modelos_calzado_id_modelo, m.codigo_modelo, m.nombre_modelo,
    p.punteras_id_puntera, pu.codigo_puntera, pu.nombre_puntera,
    p.colores_id_color, c.color, c.codigo_color,
    GROUP_CONCAT(pa.adicionales_id_adicional ORDER BY pa.orden SEPARATOR ',') AS adicionales_ids,
    GROUP_CONCAT(a.nombre_adicional ORDER BY pa.orden SEPARATOR ', ') AS adicionales
  FROM producto p
  LEFT JOIN modelos_calzado m ON m.id_modelo = p.modelos_calzado_id_modelo
  LEFT JOIN punteras pu ON pu.id_puntera = p.punteras_id_puntera
  LEFT JOIN colores c ON c.id_color = p.colores_id_color
  LEFT JOIN producto_adicionales pa ON pa.producto_id_producto = p.id_producto
  LEFT JOIN adicionales a ON a.id_adicional = pa.adicionales_id_adicional
  GROUP BY p.id_producto, p.articulo_producto, p.nombre_producto,
    p.modelos_calzado_id_modelo, m.codigo_modelo, m.nombre_modelo,
    p.punteras_id_puntera, pu.codigo_puntera, pu.nombre_puntera,
    p.colores_id_color, c.color, c.codigo_color
  ORDER BY p.id_producto DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_producto$$
CREATE PROCEDURE sp_obtener_producto(IN p_id_producto INT)
BEGIN
  SELECT p.id_producto, p.articulo_producto, p.nombre_producto,
    p.modelos_calzado_id_modelo, m.codigo_modelo, m.nombre_modelo,
    p.punteras_id_puntera, pu.codigo_puntera, pu.nombre_puntera,
    p.colores_id_color, c.color, c.codigo_color,
    GROUP_CONCAT(pa.adicionales_id_adicional ORDER BY pa.orden SEPARATOR ',') AS adicionales_ids,
    GROUP_CONCAT(a.nombre_adicional ORDER BY pa.orden SEPARATOR ', ') AS adicionales
  FROM producto p
  LEFT JOIN modelos_calzado m ON m.id_modelo = p.modelos_calzado_id_modelo
  LEFT JOIN punteras pu ON pu.id_puntera = p.punteras_id_puntera
  LEFT JOIN colores c ON c.id_color = p.colores_id_color
  LEFT JOIN producto_adicionales pa ON pa.producto_id_producto = p.id_producto
  LEFT JOIN adicionales a ON a.id_adicional = pa.adicionales_id_adicional
  WHERE p.id_producto = p_id_producto
  GROUP BY p.id_producto, p.articulo_producto, p.nombre_producto,
    p.modelos_calzado_id_modelo, m.codigo_modelo, m.nombre_modelo,
    p.punteras_id_puntera, pu.codigo_puntera, pu.nombre_puntera,
    p.colores_id_color, c.color, c.codigo_color;
END$$

DELIMITER ;
