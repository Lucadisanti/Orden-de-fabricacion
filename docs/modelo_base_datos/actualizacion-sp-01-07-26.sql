use orden_fabricacion


DELIMITER $$

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
    um.id_uso,
    um.cantidad_usada
  FROM orden_fabricacion ofab
  INNER JOIN producto prod 
    ON ofab.producto_id_producto = prod.id_producto
  INNER JOIN planilla_produccion pp 
    ON pp.orden_fabricacion_id_orden = ofab.id_orden
  LEFT JOIN uso_materiales um 
    ON um.planilla_produccion_id_planilla = pp.id_planilla
  LEFT JOIN lote_materiales lm 
    ON um.lote_materiales_id_lote = lm.id_lote
  LEFT JOIN materiales mat 
    ON lm.materiales_id_material = mat.id_material
  LEFT JOIN colores col 
    ON lm.colores_id_color = col.id_color
  LEFT JOIN remitos r 
    ON lm.remitos_id_remito = r.id_remito
  LEFT JOIN proveedores prov 
    ON r.proveedores_id_proveedor = prov.id_proveedor
  WHERE ofab.id_orden = p_id_orden
  ORDER BY pp.numero_planilla, mat.material, lm.codigo_lote;
END$$

DELIMITER ;


DELETE FROM maquinas
WHERE nombre_maquina = 'Maquina Test'
   OR nombre_maquina = 'Máquina Test';
   
INSERT INTO maquinas (nombre_maquina) VALUES
('Máquina de corte'),
('Máquina de aparado'),
('Máquina de armado'),
('Máquina INYEC-BGM'),
('Máquina INYEC-SULPOL');

DELIMITER $$

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
    lm.cantidad_recibida,
    lm.observaciones,

    r.id_remito,
    r.numero_remito,
    r.fecha_solicitud,
    r.fecha_entrega,
    r.estado_recepcion,
    r.recibido_por,

    prov.id_proveedor,
    prov.nombre_proveedor,

    um.planilla_produccion_id_planilla,
    pp.numero_planilla,
    ofab.numero_orden,
    prod.nombre_producto AS producto,

    um.cantidad_usada

  FROM uso_materiales um
  INNER JOIN lote_materiales lm 
    ON um.lote_materiales_id_lote = lm.id_lote
  INNER JOIN materiales mat 
    ON lm.materiales_id_material = mat.id_material
  LEFT JOIN colores col 
    ON lm.colores_id_color = col.id_color
  INNER JOIN remitos r 
    ON lm.remitos_id_remito = r.id_remito
  INNER JOIN proveedores prov 
    ON r.proveedores_id_proveedor = prov.id_proveedor
  INNER JOIN planilla_produccion pp 
    ON um.planilla_produccion_id_planilla = pp.id_planilla
  INNER JOIN orden_fabricacion ofab 
    ON pp.orden_fabricacion_id_orden = ofab.id_orden
  INNER JOIN producto prod 
    ON ofab.producto_id_producto = prod.id_producto

  ORDER BY um.id_uso DESC;
END$$

DELIMITER ;

USE orden_fabricacion;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_listar_lotes$$

CREATE PROCEDURE sp_listar_lotes()
BEGIN
  SELECT
    l.id_lote,
    l.remitos_id_remito,
    r.numero_remito,
    r.fecha_solicitud,
    r.fecha_entrega,
    r.estado_recepcion,
    r.recibido_por,
    r.proveedores_id_proveedor,
    p.nombre_proveedor,
    l.materiales_id_material,
    m.material,
    l.colores_id_color,
    c.color,
    l.cantidad_solicitada,
    l.cantidad_recibida,
    l.pendiente,
    l.observaciones
  FROM lote_materiales l
  INNER JOIN remitos r
    ON l.remitos_id_remito = r.id_remito
  INNER JOIN proveedores p
    ON r.proveedores_id_proveedor = p.id_proveedor
  INNER JOIN materiales m
    ON l.materiales_id_material = m.id_material
  LEFT JOIN colores c
    ON l.colores_id_color = c.id_color
  ORDER BY l.id_lote DESC;
END$$

DELIMITER ;