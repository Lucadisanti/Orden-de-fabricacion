# Sistema de órdenes de fabricación

Aplicación para administrar órdenes de fabricación de calzado, planificación por talle, planillas de producción, recepción y uso de materiales y trazabilidad.

## Tecnologías

- Frontend: React + Vite.
- Backend: Python + Flask.
- Base de datos: MySQL. El proyecto también contempla MariaDB/XAMPP; verificar compatibilidad según entorno.

## Funcionalidades principales

- Órdenes con cantidades esperadas por talle.
- Planilla R013 para Corte y Aparado.
- Planilla R013/1 para Calzado, Puntera e Inyección.
- Selección de inyectora SULPOL o BGM.
- Carga de producción por talle con teclado y avance mediante Enter.
- Comparación de pares esperados, realizados y pendientes.
- Operarios por etapa y materiales utilizados.
- Trazabilidad por orden.
- Interfaz responsive para computadora, tablet y celular.

## Documentación útil

- [Documentación técnica](docs/documentacion-tecnica.md): arquitectura, módulos, datos y limitaciones actuales.
- [Manual de instalación para el cliente](docs/manual-instalacion-cliente.md): instalación, actualización, backups y puesta en marcha.
- [Manual de usuario para el cliente](docs/manual-usuario-cliente.md): operación de las pantallas y resolución de errores habituales.
- [Guía de presentación](docs/guia-presentacion.md): recorrido de demo y preparación para profesor o empresa.
- [Instalación, actualización, backup y recuperación](docs/guia-instalacion-actualizacion.md): requisitos, configuración, actualización desde GitHub, usuarios iniciales, recuperación de acceso y pruebas básicas.
- [Flujo de stock de cuero](docs/flujo-stock-cuero.md).
- [Documento del proyecto](docs/proyecto_orden_fabricacion.docx).
- [Modelo de base de datos y SQL existentes](docs/modelo_base_datos/): revisar la guía antes de importar archivos.

## Formas de trabajo

El proyecto contempla dos modalidades:

- **Modo desarrollo/local manual:** para programar, depurar, diagnosticar problemas y preparar una recuperación si Docker falla. Requiere instalar las herramientas indicadas en la guía manual.
- **Modo empaquetado/entrega con Docker:** previsto para entregar backend y frontend preparados y reducir instalaciones manuales en la PC cliente. Los requisitos y pasos concretos quedan como **verificar según empaquetado final**.

En esta copia del repositorio no se encontraron Dockerfiles, `docker-compose.yml`, archivos Compose alternativos ni `frontend/nginx.conf`. Por eso todavía no hay un procedimiento Docker verificable para indicar comandos de construcción o arranque. La [guía operativa](docs/guia-instalacion-actualizacion.md) incluye la sección «Uso con Docker / empaquetado», los pendientes y su checklist de prueba. Los backups de MySQL siguen siendo necesarios con Docker.

## Instalación y actualización en modo desarrollo/manual

Para este modo se necesitan Python con `pip` y entorno virtual, Node.js con npm, Git y un servidor MySQL disponible. Las versiones pueden variar según la PC; verificar las dependencias del proyecto. Python 3.12 es la referencia de la documentación anterior, no una versión mínima comprobada.

Seguí la [guía operativa](docs/guia-instalacion-actualizacion.md) para clonar el repositorio, preparar una base nueva, instalar dependencias y configurar `backend/.env`.

Para actualizar, revisá primero `git status`, hacé backup antes de cualquier cambio de base de datos y seguí la secuencia `git fetch origin` / `git merge origin/main` explicada en la guía. El merge se aplica a la rama actual. No uses el SQL de instalación como actualización: contiene `DROP DATABASE`.

## Trabajo diario en modo desarrollo/manual

Con la instalación terminada, desde la raíz, en Linux/macOS:

```bash
cd backend
source venv/bin/activate
python app.py
```

En Windows CMD, reemplazá la activación por `venv\Scripts\activate.bat`.

Frontend, en otra terminal desde la raíz:

```bash
cd frontend
npm run dev
```

El backend normalmente escucha en `http://127.0.0.1:5000` y sus rutas usan `/api`. Abrí la URL que indique Vite, normalmente `http://127.0.0.1:5173`. Ambos procesos y MySQL deben permanecer encendidos.

Para comprobar la compilación del frontend, desde `frontend/`:

```bash
npm run build
```

## Testing automatizado

### Backend: Flask y pytest

**Usar una base de pruebas configurada en el entorno antes de ejecutar.** Aunque varias pruebas simulan consultas, `backend/tests/conftest.py` importa `app`, que llama a `configurar_admin()` y puede escribir en la base al importar. No se garantiza una ejecución sin MySQL ni sin efectos sobre los datos.

Desde `backend/`, con el entorno virtual activado:

```bash
python -m pip install -r requirements-test.txt
python -m pytest -v
```

Pendiente conocido: `backend/tests/test_recuperacion_local.py` referencia `entrega-cliente/scripts/recuperar-admin.py`, ausente en esta copia del proyecto. Esa prueba no puede completarse tal como está. Ver la sección de recuperación de acceso de la guía.

### Frontend: Vitest y React Testing Library

Desde `frontend/`, con dependencias instaladas:

```bash
npm test
```

Para volver a ejecutar las pruebas al guardar cambios:

```bash
npm run test:watch
```

## Antes de compartir cambios

```bash
git status
git diff --check
```

No subir `backend/.env`, contraseñas reales, códigos de recuperación, backups, `node_modules` ni `venv`. La carpeta `backups/` ya está incluida en el `.gitignore` de la raíz; esto no deja de versionar archivos que ya estuvieran registrados en Git.
