-- =========================================================
-- Base de datos: orden_fabricacion
-- Version MINIMA corregida SIN usuarios
-- Mantiene el modelo original y corrige SOLO lo indispensable.
-- Total esperado: 12 tablas
-- =========================================================

DROP DATABASE IF EXISTS orden_fabricacion;
CREATE DATABASE orden_fabricacion
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE orden_fabricacion;

-- =========================================================
-- 1) Tablas base originales
-- =========================================================
CREATE TABLE proveedores (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  nombre_proveedor VARCHAR(45) NOT NULL,
  cuit VARCHAR(45) NULL,
  telefono VARCHAR(45) NULL,
  email VARCHAR(45) NULL,

  UNIQUE KEY uq_proveedores_cuit (cuit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE materiales (
  id_material INT AUTO_INCREMENT PRIMARY KEY,
  material VARCHAR(45) NOT NULL,

  UNIQUE KEY uq_materiales_material (material)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE colores (
  id_color INT AUTO_INCREMENT PRIMARY KEY,
  color VARCHAR(45) NOT NULL,

  UNIQUE KEY uq_colores_color (color)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE maquinas (
  id_maquina INT AUTO_INCREMENT PRIMARY KEY,
  nombre_maquina VARCHAR(45) NOT NULL,

  UNIQUE KEY uq_maquinas_nombre (nombre_maquina)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 2) Producto y orden de fabricacion
-- =========================================================
CREATE TABLE producto (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  articulo_producto VARCHAR(45) NOT NULL,
  nombre_producto VARCHAR(45) NOT NULL,
  colores_id_color INT NULL,

  UNIQUE KEY uq_producto_articulo (articulo_producto),
  KEY idx_producto_color (colores_id_color),

  CONSTRAINT fk_producto_colores
    FOREIGN KEY (colores_id_color)
    REFERENCES colores (id_color)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orden_fabricacion (
  id_orden INT AUTO_INCREMENT PRIMARY KEY,
  producto_id_producto INT NOT NULL,
  numero_orden VARCHAR(45) NOT NULL,
  fecha DATE NOT NULL,

  UNIQUE KEY uq_orden_numero (numero_orden),
  KEY idx_orden_producto (producto_id_producto),

  CONSTRAINT fk_orden_producto
    FOREIGN KEY (producto_id_producto)
    REFERENCES producto (id_producto)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 3) Remitos y lotes de materiales
-- =========================================================
CREATE TABLE remitos (
  id_remito INT AUTO_INCREMENT PRIMARY KEY,
  numero_remito VARCHAR(45) NOT NULL,
  fecha_solicitud DATE NOT NULL,
  fecha_entrega DATE NULL,
  estado_recepcion VARCHAR(45) NOT NULL DEFAULT 'pendiente',
  recibido_por VARCHAR(45) NULL,
  proveedores_id_proveedor INT NOT NULL,

  UNIQUE KEY uq_remitos_numero (numero_remito),
  KEY idx_remitos_proveedor (proveedores_id_proveedor),

  CONSTRAINT fk_remitos_proveedores
    FOREIGN KEY (proveedores_id_proveedor)
    REFERENCES proveedores (id_proveedor)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lote_materiales (
  id_lote INT AUTO_INCREMENT PRIMARY KEY,
  remitos_id_remito INT NOT NULL,
  materiales_id_material INT NOT NULL,
  colores_id_color INT NULL,
  codigo_lote VARCHAR(45) NOT NULL,
  cantidad_solicitada DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad_recibida DECIMAL(10,2) NOT NULL DEFAULT 0,
  pendiente DECIMAL(10,2) NOT NULL DEFAULT 0,
  observaciones TEXT NULL,

  UNIQUE KEY uq_lote_codigo (codigo_lote),
  KEY idx_lote_remito (remitos_id_remito),
  KEY idx_lote_material (materiales_id_material),
  KEY idx_lote_color (colores_id_color),

  CONSTRAINT fk_lote_remitos
    FOREIGN KEY (remitos_id_remito)
    REFERENCES remitos (id_remito)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_lote_materiales
    FOREIGN KEY (materiales_id_material)
    REFERENCES materiales (id_material)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_lote_colores
    FOREIGN KEY (colores_id_color)
    REFERENCES colores (id_color)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 4) Planilla de produccion
-- =========================================================
CREATE TABLE planilla_produccion (
  id_planilla INT AUTO_INCREMENT PRIMARY KEY,
  orden_fabricacion_id_orden INT NOT NULL,
  numero_planilla VARCHAR(45) NOT NULL,
  fecha DATE NOT NULL,
  tipo_planilla VARCHAR(45) NOT NULL,
  maquinas_id_maquina INT NULL,
  estado VARCHAR(45) NOT NULL DEFAULT 'pendiente',

  UNIQUE KEY uq_planilla_numero (numero_planilla),
  KEY idx_planilla_orden (orden_fabricacion_id_orden),
  KEY idx_planilla_maquina (maquinas_id_maquina),

  CONSTRAINT fk_planilla_orden
    FOREIGN KEY (orden_fabricacion_id_orden)
    REFERENCES orden_fabricacion (id_orden)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_planilla_maquinas
    FOREIGN KEY (maquinas_id_maquina)
    REFERENCES maquinas (id_maquina)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_planilla (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  planilla_produccion_id_planilla INT NOT NULL,
  talle VARCHAR(10) NOT NULL,
  cantidad_pares INT NOT NULL DEFAULT 0,

  KEY idx_detalle_planilla (planilla_produccion_id_planilla),

  CONSTRAINT fk_detalle_planilla
    FOREIGN KEY (planilla_produccion_id_planilla)
    REFERENCES planilla_produccion (id_planilla)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE operarios_planilla (
  id_operario_planilla INT AUTO_INCREMENT PRIMARY KEY,
  etapa VARCHAR(45) NOT NULL,
  nombre_operario VARCHAR(45) NOT NULL,
  planilla_produccion_id_planilla INT NOT NULL,

  KEY idx_operarios_planilla (planilla_produccion_id_planilla),

  CONSTRAINT fk_operarios_planilla
    FOREIGN KEY (planilla_produccion_id_planilla)
    REFERENCES planilla_produccion (id_planilla)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 5) Uso de materiales: tabla central de trazabilidad
-- =========================================================
CREATE TABLE uso_materiales (
  id_uso INT AUTO_INCREMENT PRIMARY KEY,
  lote_materiales_id_lote INT NOT NULL,
  planilla_produccion_id_planilla INT NOT NULL,
  cantidad_usada DECIMAL(10,2) NOT NULL DEFAULT 0,

  KEY idx_uso_lote (lote_materiales_id_lote),
  KEY idx_uso_planilla (planilla_produccion_id_planilla),

  CONSTRAINT fk_uso_lote
    FOREIGN KEY (lote_materiales_id_lote)
    REFERENCES lote_materiales (id_lote)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_uso_planilla
    FOREIGN KEY (planilla_produccion_id_planilla)
    REFERENCES planilla_produccion (id_planilla)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Comprobacion: debe mostrar 12 tablas
-- =========================================================
SHOW TABLES;
