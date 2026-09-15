FROM mariadb:11.4

COPY docs/modelo_base_datos/bd_orden_fabricacion.sql /docker-entrypoint-initdb.d/01-esquema.sql
COPY docs/modelo_base_datos/stored_procedures.sql /docker-entrypoint-initdb.d/02-procedimientos.sql
