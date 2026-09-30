# Validacion del empaquetado en main

Validado el 30/09/2026 con las imagenes 0.2.1 generadas desde main:

- Construccion real de backend, frontend y database; exportacion de los tres `.tar`.
- Instalacion aislada con volumen nuevo y puerto 18099.
- Frontend HTTP 200, login maestro y API de productos con sesion HTTP 200.
- Backup con la base detenida: el script la inicia, espera y genera SQL con la tabla usuarios.
- Dependencias Python de recuperacion disponibles en la imagen del backend.
- Generador con destino alternativo: version correcta y herramienta de recuperacion incluida.
- Sintaxis PowerShell y revision de espacios en Git.

Suite de backend: 77 pruebas correctas y una falla preexistente en
`tests/test_stock_cuero.py::test_calcula_consumo_y_faltante_de_cuero` (`StopIteration`
en el mock de `fetchone`). Se reprodujo tambien en el codigo anterior a esta
integracion, commit `44892f7`. No se modifico la logica de consumo de cuero.

El cliente recibe la carpeta `entrega-cliente` con `compose.yaml`, los scripts,
el ejemplo de configuracion y las imagenes. Los datos reales y las claves locales
no se incluyen en Git. Copiar la carpeta a una PC nueva no traslada la base de datos.
