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
- **Modo empaquetado/entrega con Docker:** incluye frontend, backend y MariaDB administrados con Docker Compose. En la PC cliente requiere Docker Desktop; no hace falta instalar Python, Node.js, XAMPP ni MySQL.

## Instalación para el cliente con Docker

Antes de actualizar o instalar, seguir la [configuración de sesiones seguras](docs/configuracion-sesiones-seguras.md): preparar una clave de firma privada y, solo en una base nueva sin usuarios, la contraseña de la primera cuenta. Las cuentas existentes se conservan; las sesiones anteriores requieren un nuevo login.

La entrega se genera desde `main` siguiendo [ENTREGA_CLIENTE.md](ENTREGA_CLIENTE.md). Una vez generadas las imágenes, copiá la carpeta `entrega-cliente` completa a la otra PC y seguí [LEEME.md](entrega-cliente/LEEME.md): ejecutar `Abrir sistema.cmd`, completar las contraseñas de `.env.cliente` y volver a abrir el sistema. El puerto predeterminado es 8081. Los archivos `.tar` son locales y no se suben a GitHub.

Para ejecutar Docker desde el repositorio completo, consultá [INSTALACION_DOCKER.md](INSTALACION_DOCKER.md). El repositorio ahora incluye Dockerfiles, `compose.yaml` y `frontend/nginx.conf`; estos documentos reemplazan los pendientes de empaquetado de la [guía operativa](docs/guia-instalacion-actualizacion.md).

Los backups siguen siendo necesarios con Docker. Una instalación nueva crea una base nueva: copiar el paquete no transfiere datos existentes. Para actualizar, conservá `.env.cliente` y los backups de la instalación. Ver también [Recuperar acceso](entrega-cliente/RECUPERAR_ACCESO.md) y [Validación del empaquetado](PRUEBA_EMPAQUETADO.md).

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

La suite activa `TESTING` antes de importar la aplicación y bloquea conexiones reales a MySQL tanto durante esa importación como durante las pruebas. Cada caso debe simular la persistencia: un acceso sin mock falla en lugar de conectarse a la base configurada. No hace falta iniciar MySQL ni el backend para ejecutar estos tests.

Desde `backend/`, con el entorno virtual activado:

```bash
python -m pip install -r requirements-test.txt
python -m pytest -v
```

La herramienta `entrega-cliente/scripts/recuperar-admin.py`, referenciada por `backend/tests/test_recuperacion_local.py`, ahora está incluida. Para el procedimiento del paquete, consultá [Recuperar acceso](entrega-cliente/RECUPERAR_ACCESO.md); la guía operativa conserva el contexto de recuperación manual.

### Frontend: Vitest y React Testing Library

Desde `frontend/`, con dependencias instaladas:

```bash
npm test
```

Para volver a ejecutar las pruebas al guardar cambios:

```bash
npm run test:watch
```

### Integración continua con Jenkins

El [Jenkinsfile](Jenkinsfile) ejecuta checkout, pruebas del backend con `TESTING=1`, instalación del frontend con `npm ci`, pruebas, lint y build. Finalmente archiva `frontend/dist/**`. Usa contenedores Python 3.12 y Node 20, y requiere un agente Jenkins con acceso a Docker y al volumen `jenkins_home` donde se encuentra el workspace.

## Antes de compartir cambios

```bash
git status
git diff --check
```

No subir `backend/.env`, contraseñas reales, códigos de recuperación, backups, `node_modules` ni `venv`. La carpeta `backups/` ya está incluida en el `.gitignore` de la raíz; esto no deja de versionar archivos que ya estuvieran registrados en Git.
