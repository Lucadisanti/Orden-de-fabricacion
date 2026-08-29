USE orden_fabricacion;

DELIMITER $$

-- =========================================================
-- STORED PROCEDURES - SISTEMA ORDEN DE FABRICACION
-- MySQL / MariaDB
-- =========================================================

-- =========================================================
-- COLORES
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_colores$$
CREATE PROCEDURE sp_listar_colores()
BEGIN
  SELECT id_color, color, codigo_color
  FROM colores
  ORDER BY color;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_color$$
CREATE PROCEDURE sp_obtener_color(IN p_id_color INT)
BEGIN
  SELECT id_color, color, codigo_color
  FROM colores
  WHERE id_color = p_id_color;
END$$

DROP PROCEDURE IF EXISTS sp_crear_color$$
CREATE PROCEDURE sp_crear_color(IN p_color VARCHAR(45), IN p_codigo_color CHAR(2))
BEGIN
  INSERT INTO colores (color, codigo_color)
  VALUES (p_color, p_codigo_color);

  SELECT LAST_INSERT_ID() AS id_color, 'Color creado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_color$$
CREATE PROCEDURE sp_actualizar_color(
  IN p_id_color INT,
  IN p_color VARCHAR(45),
  IN p_codigo_color CHAR(2)
)
BEGIN
  UPDATE colores
  SET color = p_color, codigo_color = p_codigo_color
  WHERE id_color = p_id_color;

  SELECT ROW_COUNT() AS filas_afectadas, 'Color actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_color$$
CREATE PROCEDURE sp_eliminar_color(IN p_id_color INT)
BEGIN
  DELETE FROM colores
  WHERE id_color = p_id_color;

  SELECT ROW_COUNT() AS filas_afectadas, 'Color eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- MATERIALES
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_materiales$$
CREATE PROCEDURE sp_listar_materiales()
BEGIN
  SELECT id_material, material
  FROM materiales
  ORDER BY material;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_material$$
CREATE PROCEDURE sp_obtener_material(IN p_id_material INT)
BEGIN
  SELECT id_material, material
  FROM materiales
  WHERE id_material = p_id_material;
END$$

DROP PROCEDURE IF EXISTS sp_crear_material$$
CREATE PROCEDURE sp_crear_material(IN p_material VARCHAR(45))
BEGIN
  INSERT INTO materiales (material)
  VALUES (p_material);

  SELECT LAST_INSERT_ID() AS id_material, 'Material creado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_material$$
CREATE PROCEDURE sp_actualizar_material(
  IN p_id_material INT,
  IN p_material VARCHAR(45)
)
BEGIN
  UPDATE materiales
  SET material = p_material
  WHERE id_material = p_id_material;

  SELECT ROW_COUNT() AS filas_afectadas, 'Material actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_material$$
CREATE PROCEDURE sp_eliminar_material(IN p_id_material INT)
BEGIN
  DELETE FROM materiales
  WHERE id_material = p_id_material;

  SELECT ROW_COUNT() AS filas_afectadas, 'Material eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- MAQUINAS
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_maquinas$$
CREATE PROCEDURE sp_listar_maquinas()
BEGIN
  SELECT id_maquina, nombre_maquina
  FROM maquinas
  ORDER BY nombre_maquina;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_maquina$$
CREATE PROCEDURE sp_obtener_maquina(IN p_id_maquina INT)
BEGIN
  SELECT id_maquina, nombre_maquina
  FROM maquinas
  WHERE id_maquina = p_id_maquina;
END$$

DROP PROCEDURE IF EXISTS sp_crear_maquina$$
CREATE PROCEDURE sp_crear_maquina(IN p_nombre_maquina VARCHAR(45))
BEGIN
  INSERT INTO maquinas (nombre_maquina)
  VALUES (p_nombre_maquina);

  SELECT LAST_INSERT_ID() AS id_maquina, 'Máquina creada correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_maquina$$
CREATE PROCEDURE sp_actualizar_maquina(
  IN p_id_maquina INT,
  IN p_nombre_maquina VARCHAR(45)
)
BEGIN
  UPDATE maquinas
  SET nombre_maquina = p_nombre_maquina
  WHERE id_maquina = p_id_maquina;

  SELECT ROW_COUNT() AS filas_afectadas, 'Máquina actualizada correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_maquina$$
CREATE PROCEDURE sp_eliminar_maquina(IN p_id_maquina INT)
BEGIN
  DELETE FROM maquinas
  WHERE id_maquina = p_id_maquina;

  SELECT ROW_COUNT() AS filas_afectadas, 'Máquina eliminada correctamente' AS mensaje;
END$$

-- =========================================================
-- PROVEEDORES
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_proveedores$$
CREATE PROCEDURE sp_listar_proveedores()
BEGIN
  SELECT id_proveedor, nombre_proveedor, cuit, telefono, email
  FROM proveedores
  ORDER BY nombre_proveedor;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_proveedor$$
CREATE PROCEDURE sp_obtener_proveedor(IN p_id_proveedor INT)
BEGIN
  SELECT id_proveedor, nombre_proveedor, cuit, telefono, email
  FROM proveedores
  WHERE id_proveedor = p_id_proveedor;
END$$

DROP PROCEDURE IF EXISTS sp_crear_proveedor$$
CREATE PROCEDURE sp_crear_proveedor(
  IN p_nombre_proveedor VARCHAR(45),
  IN p_cuit VARCHAR(45),
  IN p_telefono VARCHAR(45),
  IN p_email VARCHAR(45)
)
BEGIN
  INSERT INTO proveedores (nombre_proveedor, cuit, telefono, email)
  VALUES (
    TRIM(p_nombre_proveedor),
    NULLIF(TRIM(p_cuit), ''),
    NULLIF(TRIM(p_telefono), ''),
    NULLIF(TRIM(p_email), '')
  );

  SELECT LAST_INSERT_ID() AS id_proveedor, 'Proveedor creado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_proveedor$$
CREATE PROCEDURE sp_actualizar_proveedor(
  IN p_id_proveedor INT,
  IN p_nombre_proveedor VARCHAR(45),
  IN p_cuit VARCHAR(45),
  IN p_telefono VARCHAR(45),
  IN p_email VARCHAR(45)
)
BEGIN
  UPDATE proveedores
  SET nombre_proveedor = TRIM(p_nombre_proveedor),
      cuit = NULLIF(TRIM(p_cuit), ''),
      telefono = NULLIF(TRIM(p_telefono), ''),
      email = NULLIF(TRIM(p_email), '')
  WHERE id_proveedor = p_id_proveedor;

  SELECT ROW_COUNT() AS filas_afectadas, 'Proveedor actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_proveedor$$
CREATE PROCEDURE sp_eliminar_proveedor(IN p_id_proveedor INT)
BEGIN
  DELETE FROM proveedores
  WHERE id_proveedor = p_id_proveedor;

  SELECT ROW_COUNT() AS filas_afectadas, 'Proveedor eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- PRODUCTOS
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_productos$$
CREATE PROCEDURE sp_listar_productos()
BEGIN
  SELECT
    p.id_producto,
    p.articulo_producto,
    p.nombre_producto,
    p.colores_id_color,
    c.color
  FROM producto p
  LEFT JOIN colores c ON p.colores_id_color = c.id_color
  ORDER BY p.id_producto DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_producto$$
CREATE PROCEDURE sp_obtener_producto(IN p_id_producto INT)
BEGIN
  SELECT
    p.id_producto,
    p.articulo_producto,
    p.nombre_producto,
    p.colores_id_color,
    c.color
  FROM producto p
  LEFT JOIN colores c ON p.colores_id_color = c.id_color
  WHERE p.id_producto = p_id_producto;
END$$

DROP PROCEDURE IF EXISTS sp_crear_producto$$
CREATE PROCEDURE sp_crear_producto(
  IN p_articulo_producto VARCHAR(45),
  IN p_nombre_producto VARCHAR(45),
  IN p_colores_id_color INT
)
BEGIN
  INSERT INTO producto (articulo_producto, nombre_producto, colores_id_color)
  VALUES (p_articulo_producto, p_nombre_producto, p_colores_id_color);

  SELECT LAST_INSERT_ID() AS id_producto, 'Producto creado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_producto$$
CREATE PROCEDURE sp_actualizar_producto(
  IN p_id_producto INT,
  IN p_articulo_producto VARCHAR(45),
  IN p_nombre_producto VARCHAR(45),
  IN p_colores_id_color INT
)
BEGIN
  UPDATE producto
  SET articulo_producto = p_articulo_producto,
      nombre_producto = p_nombre_producto,
      colores_id_color = p_colores_id_color
  WHERE id_producto = p_id_producto;

  SELECT ROW_COUNT() AS filas_afectadas, 'Producto actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_producto$$
CREATE PROCEDURE sp_eliminar_producto(IN p_id_producto INT)
BEGIN
  DELETE FROM producto
  WHERE id_producto = p_id_producto;

  SELECT ROW_COUNT() AS filas_afectadas, 'Producto eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- ORDENES DE FABRICACION
-- =========================================================
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
  GROUP BY o.id_orden, o.numero_orden, o.fecha, o.producto_id_producto, p.articulo_producto, p.nombre_producto, c.color
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

DROP PROCEDURE IF EXISTS sp_crear_orden$$
CREATE PROCEDURE sp_crear_orden(
  IN p_producto_id_producto INT,
  IN p_numero_orden VARCHAR(45),
  IN p_fecha DATE
)
BEGIN
  INSERT INTO orden_fabricacion (producto_id_producto, numero_orden, fecha)
  VALUES (p_producto_id_producto, p_numero_orden, p_fecha);

  SELECT LAST_INSERT_ID() AS id_orden, 'Orden creada correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_orden$$
CREATE PROCEDURE sp_actualizar_orden(
  IN p_id_orden INT,
  IN p_producto_id_producto INT,
  IN p_numero_orden VARCHAR(45),
  IN p_fecha DATE
)
BEGIN
  UPDATE orden_fabricacion
  SET producto_id_producto = p_producto_id_producto,
      numero_orden = p_numero_orden,
      fecha = p_fecha
  WHERE id_orden = p_id_orden;

  SELECT ROW_COUNT() AS filas_afectadas, 'Orden actualizada correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_orden$$
CREATE PROCEDURE sp_eliminar_orden(IN p_id_orden INT)
BEGIN
  DELETE FROM orden_fabricacion
  WHERE id_orden = p_id_orden;

  SELECT ROW_COUNT() AS filas_afectadas, 'Orden eliminada correctamente' AS mensaje;
END$$

-- =========================================================
-- REMITOS
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_remitos$$
CREATE PROCEDURE sp_listar_remitos()
BEGIN
  SELECT
    r.id_remito,
    r.numero_remito,
    r.fecha_solicitud,
    r.fecha_entrega,
    r.estado_recepcion,
    r.recibido_por,
    r.proveedores_id_proveedor,
    p.nombre_proveedor
  FROM remitos r
  INNER JOIN proveedores p ON r.proveedores_id_proveedor = p.id_proveedor
  ORDER BY r.fecha_solicitud DESC, r.id_remito DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_remito$$
CREATE PROCEDURE sp_obtener_remito(IN p_id_remito INT)
BEGIN
  SELECT
    r.id_remito,
    r.numero_remito,
    r.fecha_solicitud,
    r.fecha_entrega,
    r.estado_recepcion,
    r.recibido_por,
    r.proveedores_id_proveedor,
    p.nombre_proveedor
  FROM remitos r
  INNER JOIN proveedores p ON r.proveedores_id_proveedor = p.id_proveedor
  WHERE r.id_remito = p_id_remito;
END$$

DROP PROCEDURE IF EXISTS sp_crear_remito$$
CREATE PROCEDURE sp_crear_remito(
  IN p_numero_remito VARCHAR(45),
  IN p_fecha_solicitud DATE,
  IN p_fecha_entrega DATE,
  IN p_estado_recepcion VARCHAR(45),
  IN p_recibido_por VARCHAR(45),
  IN p_proveedores_id_proveedor INT
)
BEGIN
  INSERT INTO remitos (
    numero_remito,
    fecha_solicitud,
    fecha_entrega,
    estado_recepcion,
    recibido_por,
    proveedores_id_proveedor
  ) VALUES (
    p_numero_remito,
    p_fecha_solicitud,
    p_fecha_entrega,
    COALESCE(p_estado_recepcion, 'pendiente'),
    p_recibido_por,
    p_proveedores_id_proveedor
  );

  SELECT LAST_INSERT_ID() AS id_remito, 'Remito creado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_remito$$
CREATE PROCEDURE sp_actualizar_remito(
  IN p_id_remito INT,
  IN p_numero_remito VARCHAR(45),
  IN p_fecha_solicitud DATE,
  IN p_fecha_entrega DATE,
  IN p_estado_recepcion VARCHAR(45),
  IN p_recibido_por VARCHAR(45),
  IN p_proveedores_id_proveedor INT
)
BEGIN
  UPDATE remitos
  SET numero_remito = p_numero_remito,
      fecha_solicitud = p_fecha_solicitud,
      fecha_entrega = p_fecha_entrega,
      estado_recepcion = COALESCE(p_estado_recepcion, 'pendiente'),
      recibido_por = p_recibido_por,
      proveedores_id_proveedor = p_proveedores_id_proveedor
  WHERE id_remito = p_id_remito;

  SELECT ROW_COUNT() AS filas_afectadas, 'Remito actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_remito$$
CREATE PROCEDURE sp_eliminar_remito(IN p_id_remito INT)
BEGIN
  DELETE FROM remitos
  WHERE id_remito = p_id_remito;

  SELECT ROW_COUNT() AS filas_afectadas, 'Remito eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- LOTES DE MATERIALES
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_lotes$$
CREATE PROCEDURE sp_listar_lotes()
BEGIN
  SELECT
    l.id_lote,
    l.remitos_id_remito,
    r.numero_remito,
    r.proveedores_id_proveedor,
    p.nombre_proveedor,
    l.materiales_id_material,
    m.material,
    l.colores_id_color,
    c.color,
    l.codigo_lote,
    l.cantidad_solicitada,
    l.cantidad_recibida,
    l.pendiente,
    l.observaciones
  FROM lote_materiales l
  INNER JOIN remitos r ON l.remitos_id_remito = r.id_remito
  INNER JOIN proveedores p ON r.proveedores_id_proveedor = p.id_proveedor
  INNER JOIN materiales m ON l.materiales_id_material = m.id_material
  LEFT JOIN colores c ON l.colores_id_color = c.id_color
  ORDER BY l.id_lote DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_lote$$
CREATE PROCEDURE sp_obtener_lote(IN p_id_lote INT)
BEGIN
  SELECT
    l.id_lote,
    l.remitos_id_remito,
    r.numero_remito,
    r.proveedores_id_proveedor,
    p.nombre_proveedor,
    l.materiales_id_material,
    m.material,
    l.colores_id_color,
    c.color,
    l.codigo_lote,
    l.cantidad_solicitada,
    l.cantidad_recibida,
    l.pendiente,
    l.observaciones
  FROM lote_materiales l
  INNER JOIN remitos r ON l.remitos_id_remito = r.id_remito
  INNER JOIN proveedores p ON r.proveedores_id_proveedor = p.id_proveedor
  INNER JOIN materiales m ON l.materiales_id_material = m.id_material
  LEFT JOIN colores c ON l.colores_id_color = c.id_color
  WHERE l.id_lote = p_id_lote;
END$$

DROP PROCEDURE IF EXISTS sp_crear_lote$$
CREATE PROCEDURE sp_crear_lote(
  IN p_remitos_id_remito INT,
  IN p_materiales_id_material INT,
  IN p_colores_id_color INT,
  IN p_codigo_lote VARCHAR(45),
  IN p_cantidad_solicitada DECIMAL(10,2),
  IN p_cantidad_recibida DECIMAL(10,2),
  IN p_pendiente DECIMAL(10,2),
  IN p_observaciones TEXT
)
BEGIN
  INSERT INTO lote_materiales (
    remitos_id_remito,
    materiales_id_material,
    colores_id_color,
    codigo_lote,
    cantidad_solicitada,
    cantidad_recibida,
    pendiente,
    observaciones
  ) VALUES (
    p_remitos_id_remito,
    p_materiales_id_material,
    p_colores_id_color,
    p_codigo_lote,
    COALESCE(p_cantidad_solicitada, 0),
    COALESCE(p_cantidad_recibida, 0),
    COALESCE(p_pendiente, COALESCE(p_cantidad_solicitada, 0) - COALESCE(p_cantidad_recibida, 0)),
    p_observaciones
  );

  SELECT LAST_INSERT_ID() AS id_lote, 'Lote creado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_lote$$
CREATE PROCEDURE sp_actualizar_lote(
  IN p_id_lote INT,
  IN p_remitos_id_remito INT,
  IN p_materiales_id_material INT,
  IN p_colores_id_color INT,
  IN p_codigo_lote VARCHAR(45),
  IN p_cantidad_solicitada DECIMAL(10,2),
  IN p_cantidad_recibida DECIMAL(10,2),
  IN p_pendiente DECIMAL(10,2),
  IN p_observaciones TEXT
)
BEGIN
  UPDATE lote_materiales
  SET remitos_id_remito = p_remitos_id_remito,
      materiales_id_material = p_materiales_id_material,
      colores_id_color = p_colores_id_color,
      codigo_lote = p_codigo_lote,
      cantidad_solicitada = COALESCE(p_cantidad_solicitada, 0),
      cantidad_recibida = COALESCE(p_cantidad_recibida, 0),
      pendiente = COALESCE(p_pendiente, COALESCE(p_cantidad_solicitada, 0) - COALESCE(p_cantidad_recibida, 0)),
      observaciones = p_observaciones
  WHERE id_lote = p_id_lote;

  SELECT ROW_COUNT() AS filas_afectadas, 'Lote actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_lote$$
CREATE PROCEDURE sp_eliminar_lote(IN p_id_lote INT)
BEGIN
  DELETE FROM lote_materiales
  WHERE id_lote = p_id_lote;

  SELECT ROW_COUNT() AS filas_afectadas, 'Lote eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- PLANILLAS DE PRODUCCION
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_planillas$$
CREATE PROCEDURE sp_listar_planillas()
BEGIN
  SELECT
    pp.id_planilla,
    pp.numero_planilla,
    pp.fecha,
    pp.tipo_planilla,
    pp.estado,
    pp.orden_fabricacion_id_orden,
    o.numero_orden AS orden,
    o.producto_id_producto,
    pr.nombre_producto AS producto,
    pp.maquinas_id_maquina,
    m.nombre_maquina AS maquina
  FROM planilla_produccion pp
  INNER JOIN orden_fabricacion o ON pp.orden_fabricacion_id_orden = o.id_orden
  INNER JOIN producto pr ON o.producto_id_producto = pr.id_producto
  LEFT JOIN maquinas m ON pp.maquinas_id_maquina = m.id_maquina
  ORDER BY pp.fecha DESC, pp.id_planilla DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_planilla$$
CREATE PROCEDURE sp_obtener_planilla(IN p_id_planilla INT)
BEGIN
  SELECT
    pp.id_planilla,
    pp.numero_planilla,
    pp.fecha,
    pp.tipo_planilla,
    pp.estado,
    pp.orden_fabricacion_id_orden,
    o.numero_orden AS orden,
    o.producto_id_producto,
    pr.nombre_producto AS producto,
    pp.maquinas_id_maquina,
    m.nombre_maquina AS maquina
  FROM planilla_produccion pp
  INNER JOIN orden_fabricacion o ON pp.orden_fabricacion_id_orden = o.id_orden
  INNER JOIN producto pr ON o.producto_id_producto = pr.id_producto
  LEFT JOIN maquinas m ON pp.maquinas_id_maquina = m.id_maquina
  WHERE pp.id_planilla = p_id_planilla;
END$$

DROP PROCEDURE IF EXISTS sp_crear_planilla$$
CREATE PROCEDURE sp_crear_planilla(
  IN p_orden_fabricacion_id_orden INT,
  IN p_numero_planilla VARCHAR(45),
  IN p_fecha DATE,
  IN p_tipo_planilla VARCHAR(45),
  IN p_maquinas_id_maquina INT,
  IN p_estado VARCHAR(45)
)
BEGIN
  INSERT INTO planilla_produccion (
    orden_fabricacion_id_orden,
    numero_planilla,
    fecha,
    tipo_planilla,
    maquinas_id_maquina,
    estado
  ) VALUES (
    p_orden_fabricacion_id_orden,
    p_numero_planilla,
    p_fecha,
    p_tipo_planilla,
    p_maquinas_id_maquina,
    COALESCE(p_estado, 'pendiente')
  );

  SELECT LAST_INSERT_ID() AS id_planilla, 'Planilla creada correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_planilla$$
CREATE PROCEDURE sp_actualizar_planilla(
  IN p_id_planilla INT,
  IN p_orden_fabricacion_id_orden INT,
  IN p_numero_planilla VARCHAR(45),
  IN p_fecha DATE,
  IN p_tipo_planilla VARCHAR(45),
  IN p_maquinas_id_maquina INT,
  IN p_estado VARCHAR(45)
)
BEGIN
  UPDATE planilla_produccion
  SET orden_fabricacion_id_orden = p_orden_fabricacion_id_orden,
      numero_planilla = p_numero_planilla,
      fecha = p_fecha,
      tipo_planilla = p_tipo_planilla,
      maquinas_id_maquina = p_maquinas_id_maquina,
      estado = COALESCE(p_estado, 'pendiente')
  WHERE id_planilla = p_id_planilla;

  SELECT ROW_COUNT() AS filas_afectadas, 'Planilla actualizada correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_planilla$$
CREATE PROCEDURE sp_eliminar_planilla(IN p_id_planilla INT)
BEGIN
  DELETE FROM planilla_produccion
  WHERE id_planilla = p_id_planilla;

  SELECT ROW_COUNT() AS filas_afectadas, 'Planilla eliminada correctamente' AS mensaje;
END$$

-- =========================================================
-- DETALLE DE PLANILLA
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_detalles_planilla$$
CREATE PROCEDURE sp_listar_detalles_planilla(IN p_id_planilla INT)
BEGIN
  SELECT id_detalle, planilla_produccion_id_planilla, talle, cantidad_pares
  FROM detalle_planilla
  WHERE planilla_produccion_id_planilla = p_id_planilla
  ORDER BY talle;
END$$

DROP PROCEDURE IF EXISTS sp_crear_detalle_planilla$$
CREATE PROCEDURE sp_crear_detalle_planilla(
  IN p_planilla_produccion_id_planilla INT,
  IN p_talle VARCHAR(10),
  IN p_cantidad_pares INT
)
BEGIN
  INSERT INTO detalle_planilla (planilla_produccion_id_planilla, talle, cantidad_pares)
  VALUES (p_planilla_produccion_id_planilla, p_talle, COALESCE(p_cantidad_pares, 0));

  SELECT LAST_INSERT_ID() AS id_detalle, 'Detalle de planilla creado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_detalle_planilla$$
CREATE PROCEDURE sp_actualizar_detalle_planilla(
  IN p_id_detalle INT,
  IN p_talle VARCHAR(10),
  IN p_cantidad_pares INT
)
BEGIN
  UPDATE detalle_planilla
  SET talle = p_talle,
      cantidad_pares = COALESCE(p_cantidad_pares, 0)
  WHERE id_detalle = p_id_detalle;

  SELECT ROW_COUNT() AS filas_afectadas, 'Detalle de planilla actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_detalle_planilla$$
CREATE PROCEDURE sp_eliminar_detalle_planilla(IN p_id_detalle INT)
BEGIN
  DELETE FROM detalle_planilla
  WHERE id_detalle = p_id_detalle;

  SELECT ROW_COUNT() AS filas_afectadas, 'Detalle de planilla eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- OPERARIOS POR PLANILLA
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_operarios_planilla$$
CREATE PROCEDURE sp_listar_operarios_planilla(IN p_id_planilla INT)
BEGIN
  SELECT id_operario_planilla, etapa, nombre_operario, planilla_produccion_id_planilla
  FROM operarios_planilla
  WHERE planilla_produccion_id_planilla = p_id_planilla
  ORDER BY etapa, nombre_operario;
END$$

DROP PROCEDURE IF EXISTS sp_crear_operario_planilla$$
CREATE PROCEDURE sp_crear_operario_planilla(
  IN p_etapa VARCHAR(45),
  IN p_nombre_operario VARCHAR(45),
  IN p_planilla_produccion_id_planilla INT
)
BEGIN
  INSERT INTO operarios_planilla (etapa, nombre_operario, planilla_produccion_id_planilla)
  VALUES (p_etapa, p_nombre_operario, p_planilla_produccion_id_planilla);

  SELECT LAST_INSERT_ID() AS id_operario_planilla, 'Operario agregado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_operario_planilla$$
CREATE PROCEDURE sp_actualizar_operario_planilla(
  IN p_id_operario_planilla INT,
  IN p_etapa VARCHAR(45),
  IN p_nombre_operario VARCHAR(45)
)
BEGIN
  UPDATE operarios_planilla
  SET etapa = p_etapa,
      nombre_operario = p_nombre_operario
  WHERE id_operario_planilla = p_id_operario_planilla;

  SELECT ROW_COUNT() AS filas_afectadas, 'Operario actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_operario_planilla$$
CREATE PROCEDURE sp_eliminar_operario_planilla(IN p_id_operario_planilla INT)
BEGIN
  DELETE FROM operarios_planilla
  WHERE id_operario_planilla = p_id_operario_planilla;

  SELECT ROW_COUNT() AS filas_afectadas, 'Operario eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- USO DE MATERIALES
-- =========================================================
DROP PROCEDURE IF EXISTS sp_listar_usos_materiales$$
CREATE PROCEDURE sp_listar_usos_materiales()
BEGIN
  SELECT
    um.id_uso,
    um.lote_materiales_id_lote,
    lm.codigo_lote,
    lm.materiales_id_material,
    mat.material,
    lm.colores_id_color,
    col.color,
    um.planilla_produccion_id_planilla,
    pp.numero_planilla,
    ofab.numero_orden,
    prod.nombre_producto AS producto,
    um.cantidad_usada
  FROM uso_materiales um
  INNER JOIN lote_materiales lm ON um.lote_materiales_id_lote = lm.id_lote
  INNER JOIN materiales mat ON lm.materiales_id_material = mat.id_material
  LEFT JOIN colores col ON lm.colores_id_color = col.id_color
  INNER JOIN planilla_produccion pp ON um.planilla_produccion_id_planilla = pp.id_planilla
  INNER JOIN orden_fabricacion ofab ON pp.orden_fabricacion_id_orden = ofab.id_orden
  INNER JOIN producto prod ON ofab.producto_id_producto = prod.id_producto
  ORDER BY um.id_uso DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_uso_material$$
CREATE PROCEDURE sp_obtener_uso_material(IN p_id_uso INT)
BEGIN
  SELECT
    um.id_uso,
    um.lote_materiales_id_lote,
    lm.codigo_lote,
    lm.materiales_id_material,
    mat.material,
    lm.colores_id_color,
    col.color,
    um.planilla_produccion_id_planilla,
    pp.numero_planilla,
    ofab.numero_orden,
    prod.nombre_producto AS producto,
    um.cantidad_usada
  FROM uso_materiales um
  INNER JOIN lote_materiales lm ON um.lote_materiales_id_lote = lm.id_lote
  INNER JOIN materiales mat ON lm.materiales_id_material = mat.id_material
  LEFT JOIN colores col ON lm.colores_id_color = col.id_color
  INNER JOIN planilla_produccion pp ON um.planilla_produccion_id_planilla = pp.id_planilla
  INNER JOIN orden_fabricacion ofab ON pp.orden_fabricacion_id_orden = ofab.id_orden
  INNER JOIN producto prod ON ofab.producto_id_producto = prod.id_producto
  WHERE um.id_uso = p_id_uso;
END$$

DROP PROCEDURE IF EXISTS sp_crear_uso_material$$
CREATE PROCEDURE sp_crear_uso_material(
  IN p_lote_materiales_id_lote INT,
  IN p_planilla_produccion_id_planilla INT,
  IN p_cantidad_usada DECIMAL(10,2)
)
BEGIN
  INSERT INTO uso_materiales (lote_materiales_id_lote, planilla_produccion_id_planilla, cantidad_usada)
  VALUES (p_lote_materiales_id_lote, p_planilla_produccion_id_planilla, COALESCE(p_cantidad_usada, 0));

  SELECT LAST_INSERT_ID() AS id_uso, 'Uso de material registrado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_uso_material$$
CREATE PROCEDURE sp_actualizar_uso_material(
  IN p_id_uso INT,
  IN p_lote_materiales_id_lote INT,
  IN p_planilla_produccion_id_planilla INT,
  IN p_cantidad_usada DECIMAL(10,2)
)
BEGIN
  UPDATE uso_materiales
  SET lote_materiales_id_lote = p_lote_materiales_id_lote,
      planilla_produccion_id_planilla = p_planilla_produccion_id_planilla,
      cantidad_usada = COALESCE(p_cantidad_usada, 0)
  WHERE id_uso = p_id_uso;

  SELECT ROW_COUNT() AS filas_afectadas, 'Uso de material actualizado correctamente' AS mensaje;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_uso_material$$
CREATE PROCEDURE sp_eliminar_uso_material(IN p_id_uso INT)
BEGIN
  DELETE FROM uso_materiales
  WHERE id_uso = p_id_uso;

  SELECT ROW_COUNT() AS filas_afectadas, 'Uso de material eliminado correctamente' AS mensaje;
END$$

-- =========================================================
-- TRAZABILIDAD Y REPORTES
-- =========================================================
DROP PROCEDURE IF EXISTS sp_trazabilidad_por_lote$$
CREATE PROCEDURE sp_trazabilidad_por_lote(IN p_codigo_lote VARCHAR(45))
BEGIN
  SELECT
    lm.id_lote,
    lm.codigo_lote,
    mat.id_material,
    mat.material,
    col.id_color,
    col.color,
    r.id_remito,
    r.numero_remito,
    r.fecha_solicitud,
    r.fecha_entrega,
    prov.id_proveedor,
    prov.nombre_proveedor,
    um.id_uso,
    um.cantidad_usada,
    pp.id_planilla,
    pp.numero_planilla,
    pp.tipo_planilla,
    pp.fecha AS fecha_planilla,
    ofab.id_orden,
    ofab.numero_orden,
    prod.id_producto,
    prod.articulo_producto,
    prod.nombre_producto AS producto
  FROM lote_materiales lm
  INNER JOIN materiales mat ON lm.materiales_id_material = mat.id_material
  LEFT JOIN colores col ON lm.colores_id_color = col.id_color
  INNER JOIN remitos r ON lm.remitos_id_remito = r.id_remito
  INNER JOIN proveedores prov ON r.proveedores_id_proveedor = prov.id_proveedor
  LEFT JOIN uso_materiales um ON um.lote_materiales_id_lote = lm.id_lote
  LEFT JOIN planilla_produccion pp ON um.planilla_produccion_id_planilla = pp.id_planilla
  LEFT JOIN orden_fabricacion ofab ON pp.orden_fabricacion_id_orden = ofab.id_orden
  LEFT JOIN producto prod ON ofab.producto_id_producto = prod.id_producto
  WHERE lm.codigo_lote = p_codigo_lote
  ORDER BY ofab.fecha DESC, pp.fecha DESC;
END$$

DROP PROCEDURE IF EXISTS sp_ordenes_afectadas_por_lote$$
CREATE PROCEDURE sp_ordenes_afectadas_por_lote(IN p_id_lote INT)
BEGIN
  SELECT DISTINCT
    ofab.id_orden,
    ofab.numero_orden,
    ofab.fecha,
    prod.id_producto,
    prod.articulo_producto,
    prod.nombre_producto AS producto,
    pp.id_planilla,
    pp.numero_planilla,
    pp.tipo_planilla,
    um.cantidad_usada
  FROM uso_materiales um
  INNER JOIN planilla_produccion pp ON um.planilla_produccion_id_planilla = pp.id_planilla
  INNER JOIN orden_fabricacion ofab ON pp.orden_fabricacion_id_orden = ofab.id_orden
  INNER JOIN producto prod ON ofab.producto_id_producto = prod.id_producto
  WHERE um.lote_materiales_id_lote = p_id_lote
  ORDER BY ofab.fecha DESC;
END$$

DROP PROCEDURE IF EXISTS sp_materiales_por_orden$$
CREATE PROCEDURE sp_materiales_por_orden(IN p_id_orden INT)
BEGIN
  SELECT
    ofab.id_orden,
    ofab.numero_orden,
    prod.id_producto,
    prod.articulo_producto,
    prod.nombre_producto AS producto,
    pp.id_planilla,
    pp.numero_planilla,
    pp.tipo_planilla,
    lm.id_lote,
    lm.codigo_lote,
    mat.id_material,
    mat.material,
    col.color,
    r.numero_remito,
    prov.nombre_proveedor,
    um.cantidad_usada
  FROM orden_fabricacion ofab
  INNER JOIN producto prod ON ofab.producto_id_producto = prod.id_producto
  INNER JOIN planilla_produccion pp ON pp.orden_fabricacion_id_orden = ofab.id_orden
  INNER JOIN uso_materiales um ON um.planilla_produccion_id_planilla = pp.id_planilla
  INNER JOIN lote_materiales lm ON um.lote_materiales_id_lote = lm.id_lote
  INNER JOIN materiales mat ON lm.materiales_id_material = mat.id_material
  LEFT JOIN colores col ON lm.colores_id_color = col.id_color
  INNER JOIN remitos r ON lm.remitos_id_remito = r.id_remito
  INNER JOIN proveedores prov ON r.proveedores_id_proveedor = prov.id_proveedor
  WHERE ofab.id_orden = p_id_orden
  ORDER BY pp.numero_planilla, mat.material, lm.codigo_lote;
END$$

DROP PROCEDURE IF EXISTS sp_dashboard_resumen$$
CREATE PROCEDURE sp_dashboard_resumen()
BEGIN
  SELECT 'Productos' AS titulo, COUNT(*) AS valor, 'Modelos registrados' AS detalle FROM producto
  UNION ALL
  SELECT 'Proveedores' AS titulo, COUNT(*) AS valor, 'Proveedores registrados' AS detalle FROM proveedores
  UNION ALL
  SELECT 'Órdenes' AS titulo, COUNT(*) AS valor, 'Órdenes cargadas' AS detalle FROM orden_fabricacion
  UNION ALL
  SELECT 'Planillas' AS titulo, COUNT(*) AS valor, 'Planillas cargadas' AS detalle FROM planilla_produccion;
END$$

-- Catalogos para la composicion automatica del articulo
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
