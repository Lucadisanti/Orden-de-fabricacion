# Entrega desde main

La unica rama necesaria para generar entregas es `main`. Las herramientas Docker
estan en esta rama y los scripts del cliente tienen una unica fuente en
`entrega-cliente/scripts`.

Con Docker Desktop iniciado, ejecutar desde la raiz:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\crear-paquete.ps1 -Version 0.2.1
```

El comando construye y exporta backend, frontend y database dentro de
`entrega-cliente/imagenes`. Usar una version nueva para cada entrega con cambios.
Solo despues de que termine correctamente, copiar `entrega-cliente` completa a la
otra PC. No es necesario copiar el repositorio, Python ni Node.js.

El generador tambien acepta `-Destino .\tmp\entrega-nueva` para preparar una carpeta
separada. No copia configuraciones privadas ni backups y conserva la configuracion
local si el destino ya contiene `.env.cliente`.

GitHub no contiene los archivos `.tar`. Descargar el repositorio no reemplaza la
generacion de imagenes. La carpeta local preparada si contiene todo el paquete.

Seguir [las instrucciones de instalacion](entrega-cliente/LEEME.md) en la otra PC.
Una instalacion nueva crea una base nueva; para trasladar datos hace falta
restaurar un backup. Para actualizar una instalacion existente, conservar su
`.env.cliente` (incluido el puerto elegido) y sus backups.
