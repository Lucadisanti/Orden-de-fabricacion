# Entrega sin código fuente

Generar la entrega desde esta rama:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\crear-paquete.ps1 -Version 0.1.0
```

Entregar únicamente la carpeta `entrega-cliente`. No incluir el repositorio.

## Primera instalación del cliente

1. Copiar `entrega-cliente` a una ubicación estable, por ejemplo `C:\OrdenFabricacion`.
2. Abrir PowerShell en esa carpeta.
3. Ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-paquete.ps1
```

4. Abrir `.env.cliente`, definir las dos contraseñas y guardar.
5. Ejecutar de nuevo el comando anterior.
6. Abrir `http://localhost:8080`.

## Actualización

Entregar solamente la carpeta `imagenes` nueva. El cliente reemplaza su carpeta `imagenes` y hace doble clic en `Abrir sistema.cmd`; el acceso directo detecta la versión, realiza el backup y abre el sistema.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\actualizar-paquete.ps1
```

El script crea un backup antes de cargar imágenes y mantiene el volumen `orden_fabricacion_datos`. Nunca usar `docker compose down -v`.

## Inicio con doble clic

El archivo `Abrir sistema.cmd` puede copiarse al escritorio como acceso directo. El cliente reemplaza la carpeta `imagenes` cuando recibe una actualización y luego hace doble clic en ese archivo: crea un backup, carga las imágenes, actualiza el sistema y abre el navegador.
