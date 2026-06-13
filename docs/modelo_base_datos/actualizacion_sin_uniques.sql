SELECT * FROM maquinas;
SELECT * FROM orden_fabricacion;

SHOW INDEX FROM remitos;
SHOW INDEX FROM planilla_produccion;
-- Eliminar restricción UNIQUE de remitos
ALTER TABLE remitos
DROP INDEX uq_remitos_numero;
-- Eliminar restricción UNIQUE de planillas
ALTER TABLE planilla_produccion
DROP INDEX uq_planilla_numero;

-- Permitir que el código de lote sea opcional

ALTER TABLE lote_materiales
MODIFY codigo_lote VARCHAR(50) NULL;

CALL sp_listar_lotes();
-- actualizar sp listar uso materiales

DROP PROCEDURE IF EXISTS sp_listar_usos_materiales;

DELIMITER //

CREATE PROCEDURE sp_listar_usos_materiales()
BEGIN
  SELECT
    um.id_uso,
    um.lote_materiales_id_lote,

    lm.id_lote,
    lm.materiales_id_material,
    mat.material,
    lm.colores_id_color,
    col.color,

    r.id_remito,
    r.numero_remito,
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
  INNER JOIN remitos r
    ON lm.remitos_id_remito = r.id_remito
  INNER JOIN proveedores prov
    ON r.proveedores_id_proveedor = prov.id_proveedor
  INNER JOIN materiales mat
    ON lm.materiales_id_material = mat.id_material
  LEFT JOIN colores col
    ON lm.colores_id_color = col.id_color
  INNER JOIN planilla_produccion pp
    ON um.planilla_produccion_id_planilla = pp.id_planilla
  INNER JOIN orden_fabricacion ofab
    ON pp.orden_fabricacion_id_orden = ofab.id_orden
  INNER JOIN producto prod
    ON ofab.producto_id_producto = prod.id_producto
  ORDER BY um.id_uso DESC;
END //

DELIMITER ;



DROP PROCEDURE IF EXISTS sp_crear_detalle_planilla;

DELIMITER //

CREATE PROCEDURE sp_crear_detalle_planilla(
    IN p_planilla_produccion_id_planilla INT,
    IN p_talle VARCHAR(10),
    IN p_cantidad_pares INT
)
BEGIN
    DECLARE v_id_detalle INT DEFAULT NULL;

    SELECT id_detalle
    INTO v_id_detalle
    FROM detalle_planilla
    WHERE planilla_produccion_id_planilla = p_planilla_produccion_id_planilla
      AND talle = p_talle
    LIMIT 1;

    IF v_id_detalle IS NOT NULL THEN
        UPDATE detalle_planilla
        SET cantidad_pares = cantidad_pares + p_cantidad_pares
        WHERE id_detalle = v_id_detalle;
    ELSE
        INSERT INTO detalle_planilla (
            planilla_produccion_id_planilla,
            talle,
            cantidad_pares
        )
        VALUES (
            p_planilla_produccion_id_planilla,
            p_talle,
            p_cantidad_pares
        );
    END IF;
END //

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_eliminar_planilla;

DELIMITER //

CREATE PROCEDURE sp_eliminar_planilla(IN p_id_planilla INT)
BEGIN

  DELETE FROM detalle_planilla
  WHERE planilla_produccion_id_planilla = p_id_planilla;

  DELETE FROM operarios_planilla
  WHERE planilla_produccion_id_planilla = p_id_planilla;

  DELETE FROM uso_materiales
  WHERE planilla_produccion_id_planilla = p_id_planilla;

  DELETE FROM planilla_produccion
  WHERE id_planilla = p_id_planilla;

  SELECT
    ROW_COUNT() AS filas_afectadas,
    'Planilla eliminada correctamente' AS mensaje;

END //

DELIMITER ;