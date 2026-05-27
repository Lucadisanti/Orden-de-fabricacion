USE orden_fabricacion;

-- =========================================================
-- 1) Comprobar que existan exactamente 12 tablas
-- =========================================================
SELECT COUNT(*) AS cantidad_tablas
FROM information_schema.tables
WHERE table_schema = 'orden_fabricacion'
  AND table_type = 'BASE TABLE';

SHOW TABLES;

-- =========================================================
-- 2) Verificar claves foráneas creadas
-- =========================================================
SELECT 
    TABLE_NAME AS tabla,
    COLUMN_NAME AS columna,
    REFERENCED_TABLE_NAME AS tabla_referenciada,
    REFERENCED_COLUMN_NAME AS columna_referenciada
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'orden_fabricacion'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- =========================================================
-- 3) Insertar datos de prueba dentro de una transacción
--    Al final se hace ROLLBACK para no dejar datos cargados.
-- =========================================================
START TRANSACTION;

INSERT INTO proveedores (nombre_proveedor, cuit, telefono, email)
VALUES ('Proveedor Test', '20-12345678-9', '1111-2222', 'proveedor@test.com');
SET @id_proveedor = LAST_INSERT_ID();

INSERT INTO remitos (numero_remito, fecha_solicitud, fecha_entrega, estado_recepcion, recibido_por, proveedores_id_proveedor)
VALUES ('REMITO-TEST-001', '2026-05-01', '2026-05-02', 'Recibido', 'Operario Test', @id_proveedor);
SET @id_remito = LAST_INSERT_ID();

INSERT INTO materiales (material)
VALUES ('Cuero Test');
SET @id_material = LAST_INSERT_ID();

INSERT INTO colores (color)
VALUES ('Negro Test');
SET @id_color = LAST_INSERT_ID();

INSERT INTO lote_materiales (
    remitos_id_remito,
    materiales_id_material,
    colores_id_color,
    codigo_lote,
    cantidad_solicitada,
    cantidad_recibida,
    pendiente,
    observaciones
)
VALUES (
    @id_remito,
    @id_material,
    @id_color,
    'LOTE-TEST-001',
    100.00,
    100.00,
    0.00,
    'Lote de prueba'
);
SET @id_lote = LAST_INSERT_ID();

INSERT INTO producto (articulo_producto, nombre_producto, colores_id_color)
VALUES ('ART-TEST-001', 'Zapato Test', @id_color);
SET @id_producto = LAST_INSERT_ID();

INSERT INTO orden_fabricacion (producto_id_producto, numero_orden, fecha)
VALUES (@id_producto, 'ORDEN-TEST-001', '2026-05-03');
SET @id_orden = LAST_INSERT_ID();

INSERT INTO maquinas (nombre_maquina)
VALUES ('Máquina Test');
SET @id_maquina = LAST_INSERT_ID();

INSERT INTO planilla_produccion (
    orden_fabricacion_id_orden,
    numero_planilla,
    fecha,
    tipo_planilla,
    maquinas_id_maquina,
    estado
)
VALUES (
    @id_orden,
    'PLANILLA-TEST-001',
    '2026-05-04',
    'Producción',
    @id_maquina,
    'En curso'
);
SET @id_planilla = LAST_INSERT_ID();

INSERT INTO detalle_planilla (planilla_produccion_id_planilla, talle, cantidad_pares)
VALUES (@id_planilla, '40', 10);

INSERT INTO operarios_planilla (etapa, nombre_operario, planilla_produccion_id_planilla)
VALUES ('Corte', 'Operario Test', @id_planilla);

INSERT INTO uso_materiales (lote_materiales_id_lote, planilla_produccion_id_planilla, cantidad_usada)
VALUES (@id_lote, @id_planilla, 15.50);

-- =========================================================
-- 4) Consulta principal de trazabilidad
--    Debe devolver una fila con LOTE-TEST-001, REMITO-TEST-001,
--    ORDEN-TEST-001 y Zapato Test.
-- =========================================================
SELECT 
    lm.codigo_lote,
    m.material,
    c.color,
    r.numero_remito,
    p.articulo_producto,
    p.nombre_producto,
    ofab.numero_orden,
    pp.numero_planilla,
    um.cantidad_usada
FROM uso_materiales um
INNER JOIN lote_materiales lm 
    ON um.lote_materiales_id_lote = lm.id_lote
INNER JOIN materiales m 
    ON lm.materiales_id_material = m.id_material
INNER JOIN colores c 
    ON lm.colores_id_color = c.id_color
INNER JOIN remitos r 
    ON lm.remitos_id_remito = r.id_remito
INNER JOIN planilla_produccion pp 
    ON um.planilla_produccion_id_planilla = pp.id_planilla
INNER JOIN orden_fabricacion ofab 
    ON pp.orden_fabricacion_id_orden = ofab.id_orden
INNER JOIN producto p 
    ON ofab.producto_id_producto = p.id_producto
WHERE lm.codigo_lote = 'LOTE-TEST-001';

-- =========================================================
-- 5) Revertir datos de prueba
-- =========================================================
ROLLBACK;

-- Después del ROLLBACK, esta consulta debe devolver 0.
SELECT COUNT(*) AS registros_test_restantes
FROM lote_materiales
WHERE codigo_lote = 'LOTE-TEST-001';
