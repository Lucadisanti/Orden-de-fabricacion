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

Entregar la nueva carpeta `imagenes` junto con un `.env.cliente` que apunte a las nuevas etiquetas de versión. El cliente ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\actualizar-paquete.ps1
```

El script crea un backup antes de cargar imágenes y mantiene el volumen `orden_fabricacion_datos`. Nunca usar `docker compose down -v`.
