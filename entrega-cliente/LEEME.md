# Instalar en otra PC

Esta carpeta se prepara desde la rama `main`. Para copiarla a otra PC debe incluir
las tres imagenes `.tar` dentro de `imagenes` (backend, frontend y database).
GitHub guarda los scripts, pero no guarda esas imagenes.

1. Instalar e iniciar Docker Desktop en la otra PC.
2. Copiar esta carpeta completa a una ubicacion estable.
3. Ejecutar `Abrir sistema.cmd`. En el primer inicio crea `.env.cliente`.
4. Completar las dos contrasenas en `.env.cliente`. `APP_PORT` define el puerto:
   por defecto 8081; puede cambiarse a 8099 si se prefiere.
5. Ejecutar otra vez `Abrir sistema.cmd` y esperar el inicio.
6. Abrir `http://localhost:8081` (o el puerto elegido).

Para detener, usar `Cerrar sistema.cmd`. Los datos quedan en el volumen Docker.
Si aparece un error, la consola queda abierta para poder leerlo.

Una PC nueva comienza con una base nueva. Copiar esta carpeta no transfiere los
datos de otra instalacion: eso requiere un backup y su restauracion.
Para una instalacion nueva no copiar un `.env.cliente` ni backups de otra PC.

## Actualizar una instalacion existente

Conservar su `.env.cliente` y su carpeta `backups`. Copiar los scripts actualizados,
`compose.yaml`, los archivos `.cmd` y las nuevas imagenes. Ejecutar `Abrir sistema.cmd`:
si cambia la version, prepara la base, hace el backup y aplica la actualizacion.
No usar `docker compose down -v`: elimina los datos.

## Preparar una nueva entrega desde main

En la raiz del repositorio, con Docker Desktop iniciado:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\crear-paquete.ps1 -Version 0.2.1
```

Usar una version nueva para cada entrega con cambios. Al terminar, esta carpeta
incluye las imagenes del codigo compilado y esta lista para copiar.
