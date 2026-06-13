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