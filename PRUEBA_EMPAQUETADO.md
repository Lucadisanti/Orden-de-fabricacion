# Prueba de paquete para cliente

El cliente recibirá solamente `compose.cliente.yaml`, `.env.cliente`, los scripts, la carpeta `imagenes` y los backups. No recibirá este repositorio.

Las imágenes se entregan como archivos `.tar`, cargados con `docker load`. La base conserva el volumen `orden_fabricacion_datos`; por eso una actualización no borra información ni crea otra base.

## Validación pendiente

1. Construir `database`, `backend` y `frontend` con la etiqueta de versión.
2. Exportarlas con `docker save` dentro de `imagenes`.
3. Crear una instalación de prueba con una copia de la base existente.
4. Ejecutar `scripts/actualizar-paquete.ps1` y verificar datos y migraciones.
