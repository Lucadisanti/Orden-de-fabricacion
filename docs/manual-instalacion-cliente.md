# Manual de instalación y actualización para el cliente

Este manual está dirigido a quien prepara y mantiene la PC o servidor de Orden de Fabricación. Para la operación diaria, consultar el [manual de usuario](manual-usuario-cliente.md); para conocer la estructura, la [documentación técnica](documentacion-tecnica.md).

Los comandos de este documento corresponden al **modo manual/local**. Se escriben en una terminal, no en el navegador. Los ejemplos usan Linux/macOS salvo los bloques Windows CMD. Cada bloque indica desde qué carpeta ejecutarlo. La entrega Docker está **pendiente de verificar según empaquetado final** y no se instala con estos comandos por suposición.

## 1. Requisitos previos

| Requisito | Qué preparar |
| --- | --- |
| PC o servidor | Equipo con permisos de instalación, espacio para aplicación, base y backups. No hay un mínimo de RAM/CPU certificado en el proyecto; dimensionar según volumen y usuarios y probar en la PC destino. |
| Git | Acceso al repositorio para descargar y actualizar la versión acordada con el equipo. |
| Python y pip | Python 3.12 es la referencia de la documentación del proyecto; verificar las dependencias de `backend/requirements.txt` en el sistema destino. |
| Entorno virtual | Soporte de `venv` para separar las dependencias del backend. |
| Node.js y npm | Versión compatible con las dependencias. El Vite fijado en el lockfile revisado declara Node `^20.19.0 || >=22.12.0`; revisar además los requisitos de las herramientas de tests del mismo lockfile. |
| MySQL | Servidor activo, usuario autorizado, base preparada y acceso a `mysql`/`mysqldump` si se usan herramientas de consola. Las cuentas de MySQL son distintas de las de la aplicación. |
| Navegador | Navegador actualizado en el que se ensayen formularios, descarga de PDF y las pantallas de la instalación. |
| Conexión | Acceso para clonar e instalar dependencias; acceso de red a los servicios si no corren en la misma PC. |
| Docker | Opción de entrega prevista. Compatibilidad, recursos e instalación: **pendiente de verificar según empaquetado final**. |

XAMPP/phpMyAdmin es una alternativa para administrar la base, no un requisito universal. Si se utiliza MariaDB, verificar compatibilidad de SQL, procedimientos y backup en ese entorno antes de darlo por equivalente a MySQL.

Antes de empezar, acordar con el responsable la versión a instalar, ubicación de la base, usuarios y destino de los respaldos. Los pasos de instalación desde cero no deben ejecutarse sobre datos existentes.

## 2. Instalación manual paso a paso

### 2.1. Descargar el proyecto

En una carpeta donde se pueda guardar el proyecto:

```bash
git clone https://github.com/Lucadisanti/Orden-de-fabricacion.git
cd Orden-de-fabricacion
git status
git branch --show-current
```

Confirmar con el equipo que la rama/versión descargada sea la de entrega. Clonar la rama predeterminada no garantiza que incluya todas las mejoras de otra rama. La carpeta `Orden-de-fabricacion` será la **raíz del proyecto** mencionada en los pasos siguientes.

### 2.2. Preparar el backend

Desde la raíz, en Linux/macOS:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
```

Alternativa Windows CMD, desde la raíz, si está instalado el lanzador de Python 3.12:

```bat
cd backend
py -3.12 -m venv venv
venv\Scripts\activate.bat
python -m pip install -r requirements.txt
```

Si falla la creación de `venv` o la instalación, resolver el error antes de continuar. No sustituir dependencias o versiones al azar.

### 2.3. Configurar la conexión

Desde `backend/`, **solo si no existe `.env`**, copiar la plantilla pública:

```bash
cp .env.example .env
```

En Windows CMD, la alternativa es `copy .env.example .env`. En una actualización se conserva el `.env` existente.

Editar `backend/.env` con los valores de la instalación. Los siguientes textos son ejemplos públicos y marcadores para reemplazar, no credenciales utilizables:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_NAME=orden_fabricacion
DB_USER=USUARIO_MYSQL_DE_LA_INSTALACION
DB_PASSWORD=REEMPLAZAR_POR_LA_CLAVE_MYSQL
FLASK_SECRET_KEY=REEMPLAZAR_POR_UNA_CLAVE_SECRETA_PROPIA
```

El usuario de MySQL debe existir y tener los permisos que requiera la instalación, incluidos los ajustes de esquema. El login de la aplicación no crea esa cuenta. Guardar la clave de sesión de forma protegida y conservarla según el procedimiento operativo; no publicar `.env` ni utilizar estos marcadores literalmente.

### 2.4. Preparar una base nueva

Iniciar MySQL. **Comprobar que no hay una base `orden_fabricacion` con datos que deban conservarse:** el primer archivo de instalación contiene `DROP DATABASE IF EXISTS orden_fabricacion` y la recrea. Si hay datos, detener esta instalación desde cero y seguir las secciones de backup y actualización.

En una instalación nueva, importar con una herramienta como phpMyAdmin, en este orden:

1. [bd_orden_fabricacion.sql](modelo_base_datos/bd_orden_fabricacion.sql).
2. [stored_procedures.sql](modelo_base_datos/stored_procedures.sql).

Revisar todos los mensajes de importación y comprobar que existan tablas y procedimientos almacenados. La URL de phpMyAdmin depende de cómo esté instalado; no es una pantalla de esta aplicación.

No importar por rutina otros SQL de prueba o migraciones históricas. La compatibilidad de esa base inicial con la versión entregada y los ajustes necesarios se revisan en la sección 6. Si se prueban ajustes después de preparar datos, hacer primero backup.

### 2.5. Preparar el frontend

En otra terminal, desde la raíz:

```bash
cd frontend
npm install
npm run build
```

La compilación debe terminar correctamente. Una advertencia de tamaño de bundle es diferente de un error que interrumpe el build. `npm run build` produce los archivos de la interfaz, pero no inicia MySQL ni Flask ni configura su publicación en red.

### 2.6. Iniciar el backend

Con MySQL disponible y el esquema revisado, desde `backend/` y con el entorno virtual activo:

```bash
python app.py
```

Normalmente responde en `http://127.0.0.1:5000`. Abrir esa dirección permite comprobar el mensaje de estado, pero no sustituye el login y las pruebas funcionales de conexión a la base. Mantener la terminal abierta y revisar errores de arranque.

Este comando usa el servidor de desarrollo de Flask con depuración. La publicación para uso real debe definir un servidor y una configuración adecuados; este arranque local no acredita una instalación de producción terminada.

### 2.7. Iniciar el frontend

Desde `frontend/`, en su terminal:

```bash
npm run dev
```

Abrir la dirección que indique Vite, normalmente `http://127.0.0.1:5173`. Mantener abiertos frontend y backend y mantener MySQL activo. Vite redirige `/api` al backend local en el puerto 5000; no hay una variable `VITE_API_URL` configurada para reemplazar ese proxy en el archivo actual.

`127.0.0.1` significa «esta PC». Para acceder desde otra computadora deben definirse direcciones, publicación y conexión entre servicios con el instalador; copiar esa URL en otra PC no conecta automáticamente al servidor original. Abrir `dist/index.html` directamente tampoco configura una API.

## 3. Instalación o entrega con Docker

Docker se prevé para entregar componentes preparados y reducir la instalación manual de dependencias en la PC cliente. En esta rama no se encontraron Dockerfiles, archivos Compose ni `frontend/nginx.conf`. **Pendiente de verificar según empaquetado final**: no hay comandos de arranque o nombres de servicios comprobados para indicar aquí.

Antes de entregar, el paquete debe documentar y probar:

- Archivos/imágenes incluidos, versiones, requisitos de Docker y pasos reales para iniciar, detener, reiniciar y actualizar.
- Puertos y URL publicados, acceso desde la PC y desde otras computadoras autorizadas.
- Variables de entorno, credenciales de conexión y clave de sesión, sin incluir secretos en el repositorio.
- Servidor del frontend, nginx si se elige, navegación de React y redirección de `/api`.
- Servidor backend, conexión entre servicios y registros para diagnosticar errores.
- MySQL dentro de un contenedor o externo, inicialización y procedimiento de migración.
- Volúmenes, montajes, permisos y persistencia al reiniciar, recrear o actualizar los contenedores.
- Backup fuera del contenedor, restauración y recuperación ante fallas.

Todos estos puntos están **pendientes de verificar según empaquetado final**. Los volúmenes conservan datos, pero no reemplazan backups. No eliminar volúmenes para resolver una falla. Actualizar Git por sí solo no actualiza imágenes ni garantiza que los servicios ejecuten el código nuevo.

La aceptación del paquete debe incluir login, una carga demo, consulta posterior a reinicio/recreación, PDF y restauración probada en un entorno separado. No se ejecutó una entrega Docker al redactar este manual.

## 4. Actualización desde GitHub

Realizarla con una persona responsable del sistema, fuera de la carga habitual. Para Docker, adaptar el proceso a su paquete final.

1. Coordinar una pausa, guardar el trabajo y hacer un backup verificado antes de iniciar una versión que pueda ajustar la base. Anotar la versión anterior y detener los servidores de desarrollo mientras se actualiza.
2. Desde la raíz, revisar:

   ```bash
   git status
   git branch --show-current
   ```

   Si hay cambios sin resguardar o un merge pendiente, resolverlos con el equipo antes de continuar. No descartar archivos locales para forzar la actualización.

3. Desde la raíz, traer e integrar los cambios:

   ```bash
   git fetch origin
   git merge origin/main
   ```

   El merge incorpora `origin/main` en **la rama actual**; no cambia de rama automáticamente. Confirmar que sea la rama que se pretende mantener.

4. Si hay conflictos, detener la puesta en marcha. Revisar ambas versiones y combinar funciones y mejoras, quitar los marcadores, verificar los archivos y completar el merge según Git. No elegir todo «Current» o «Incoming» sin revisión. Si no se sabe resolver, pedir asistencia al equipo. El merge puede generar un commit de integración: aquí solo se documenta el procedimiento.
5. Desde `backend/`, activar `venv` y actualizar dependencias:

   ```bash
   python -m pip install -r requirements.txt
   ```

6. Desde `frontend/`:

   ```bash
   npm install
   npm run build
   ```

7. Revisar el esquema según la sección 6. Iniciar backend y frontend y completar el checklist de puesta en marcha. Ante errores de tablas o procedimientos, detener nuevas cargas y revisar la actualización.

Volver al código anterior no revierte automáticamente la base. Una recuperación debe contemplar juntos código, esquema, procedimientos y datos.

## 5. Backup y restauración

### Crear una copia

Hacer backup antes de actualizaciones, migraciones o cambios importantes en datos, y establecer una frecuencia regular según la operación de la empresa. Evitar escrituras mientras se hace la copia y anotar fecha, versión y base respaldada.

Ejemplo documentado por el proyecto, desde la raíz en Linux/macOS:

```bash
mkdir -p backups
mysqldump --no-tablespaces -u orden_user -p orden_fabricacion > backups/backup_orden_fabricacion_FECHA.sql
```

`orden_user` es un ejemplo: reemplazarlo por la cuenta real de MySQL, ya creada. Reemplazar `FECHA` por fecha y hora y usar un nombre nuevo; `>` sobrescribe un archivo existente. `-p` pide la contraseña de MySQL sin dejarla escrita en el comando. Adaptar host y puerto si no se usan los predeterminados.

Como la aplicación usa procedimientos, una copia que los incluya puede hacerse con los permisos correspondientes:

```bash
mysqldump --no-tablespaces --routines --events -u orden_user -p orden_fabricacion > backups/backup_orden_fabricacion_completo_FECHA.sql
```

La copia básica no incluye por defecto las rutinas. Si se usa esa variante, conservar también los procedimientos de la misma versión respaldada. Verificar permisos y compatibilidad de las opciones del cliente de backup instalado.

### Verificar y conservar

Con el nombre real utilizado en el comando:

```bash
ls -lh backups/backup_orden_fabricacion_completo_FECHA.sql
```

Si se eligió la copia básica, comprobar su nombre en lugar del ejemplo de copia completa. **Un backup de 0 bytes no es válido.** Revisar también el resultado del comando, errores y contenido SQL; un tamaño mayor que cero no asegura que esté completo. Comprobar una restauración de prueba.

No subir backups al repositorio ni compartirlos con las credenciales. `backups/` está ignorado por Git; eso no elimina archivos que ya estuvieran versionados. Mantener una copia protegida fuera de la PC del sistema. En Windows, usar las herramientas y shell acordadas; el Explorador permite comprobar tamaño, y la codificación de una redirección puede variar según la shell.

### Restaurar con cuidado

1. Identificar la copia correcta y preservar datos posteriores que puedan perderse. Coordinar el reemplazo con el responsable.
2. Detener el backend y las cargas. Revisar el SQL y los nombres de base: la restauración puede eliminar o reemplazar información.
3. Probar primero en un servidor/entorno separado con configuración compatible. No asumir que elegir otra base en una herramienta evita sentencias `USE` o de borrado incluidas en el archivo.
4. Importar con la herramienta acordada y revisar todos los errores, incluidos permisos y definidores de procedimientos.
5. Comprobar tablas, datos y rutinas. Iniciar la versión compatible de la aplicación y validar login, órdenes, cantidades, stock y PDFs conocidos.
6. Reabrir el uso solo después de la revisión responsable.

La adaptación concreta a MySQL, permisos y destino de restauración depende del entorno. Para contenedores: **pendiente de verificar según empaquetado final**. No existe un backup automático confirmado por este manual.

## 6. Actualización de la base de datos

**Backup primero, incluso antes de arrancar el backend actualizado.** El arranque ejecuta preparación de cuentas y algunos módulos aseguran columnas o tablas al recibir solicitudes. La lectura de pantallas tras una actualización puede requerir ajustes de esquema.

El script `backend/migrate_db.py` realiza ajustes adicionales y actualiza ciertos procedimientos, pero **no se invoca automáticamente desde `app.py`**. Tampoco instala toda la aplicación sobre una base inexistente.

Si el equipo confirma que corresponde para la base y versión elegidas, detener el backend y, desde `backend/` con `venv` activo, ejecutar:

```bash
python migrate_db.py
```

Revisar la salida antes de iniciar `python app.py`. No asumir que cualquier fallo revierte todos los cambios. Las migraciones históricas de talles y códigos de producto deben revisarse según el estado previo: no repetirlas por rutina ni importar el SQL que borra la base como una «actualización».

Después, levantar el backend actualizado, revisar errores y comprobar las pantallas con datos conocidos. El orden exacto de ajustes para una base antigua queda pendiente de verificación del entorno por el responsable técnico.

## 7. Usuarios iniciales o demo

Estas cuentas ya están documentadas en la [guía operativa](guia-instalacion-actualizacion.md) y definidas en el proyecto:

| Usuario | Contraseña inicial/demo | Rol |
| --- | --- | --- |
| `Admin` | `Admin1234` | Maestro |
| `Ariel_disanti@bohm.com` | `Admin1234` | Administrador |
| `Usuario` | `Admin1234` | Empleado |

**Cambiar las contraseñas para uso real** desde Usuarios con los permisos correspondientes. Respetar las mayúsculas al ingresar. La carga inicial conserva las cuentas existentes; si las claves fueron cambiadas, reiniciar no restaura `Admin1234`. Estas credenciales no son las de MySQL.

Preparar un código de recuperación de la cuenta maestra desde **Usuarios → Generar código**, guardarlo de forma segura fuera del repositorio y comprobar que el responsable sabe usarlo. El flujo del login requiere una cuenta maestra activa y su código; no envía correos.

**Pendiente: recuperación local sin código.** El login menciona una herramienta local, pero `entrega-cliente/scripts/recuperar-admin.py` no existe en esta rama. Confirmar su disponibilidad y procedimiento con el equipo; no recrear la base para recuperar acceso.

## 8. Puesta en marcha y aceptación

Para iniciar el modo manual cada día: MySQL activo, `python app.py` desde `backend/` con el entorno activado y `npm run dev` desde `frontend/`, en terminales separadas. Abrir la URL indicada, ingresar y mantener los servicios activos.

Completar con datos demo o consultas de registros conocidos:

- [ ] MySQL accesible y backend sin errores de conexión/esquema.
- [ ] Frontend cargado y comunicación con la API funcionando.
- [ ] Login, cierre de sesión y nuevo ingreso correctos.
- [ ] Roles y cuentas revisados; claves iniciales reemplazadas para uso real.
- [ ] Catálogos y producto con consumo por par preparados.
- [ ] Recepción demo, orden y saldo de cuero coherentes; probar faltante/cancelación solo en datos de prueba.
- [ ] Recepción de cortes, planilla y producción consultables sin duplicar cargas.
- [ ] Uso de materiales y trazabilidad relacionados con la orden correcta.
- [ ] PDFs descargados y abiertos; estadísticas con fechas y resultados conocidos.
- [ ] Historial visible para administrador/maestro cuando el registro dispone de esa información.
- [ ] Backup verificado, destino seguro y restauración probada.
- [ ] Persona responsable, URL, versión entregada y procedimiento de soporte registrados.

La [guía de presentación](guia-presentacion.md) ayuda a ensayar. Los datos demo deben prepararse: no se promete un conjunto completo precargado. Esta documentación no ejecutó instalaciones, backups ni pruebas de aceptación reales.

## 9. Problemas frecuentes

| Problema | Qué revisar y cómo continuar |
| --- | --- |
| MySQL `Access denied` | Verificar con el instalador usuario, contraseña, host, puerto y permisos de la cuenta MySQL. No usar la clave demo de la aplicación como si fuera la de la base. `--no-tablespaces` no concede permisos ni corrige una contraseña. |
| Backend apagado | Comprobar MySQL y su terminal. Activar el entorno virtual y ejecutar `python app.py` desde `backend/`; resolver el primer error antes de reintentar desde la interfaz. |
| Frontend no conecta | Revisar URL de Vite, backend en el puerto esperado y proxy `/api`. No abrir el HTML compilado directamente. Para otra PC o Docker, revisar la configuración de red de esa entrega. |
| Login falla | Respetar mayúsculas, cuenta activa y clave vigente. Usar el código de recuperación si corresponde o pedir cambio a quien tenga permisos. Reiniciar no restablece las claves iniciales. |
| Backup de 0 bytes | Revisar el error de `mysqldump`, disponibilidad de la herramienta, conexión y permisos. Repetir con un nombre nuevo y verificar; no restaurar desde el archivo vacío. |
| Conflictos Git | Detener la actualización y pedir revisión de ambas versiones. No iniciar con marcadores ni descartar cambios automáticamente. |
| Bundle grande en build | Si finalizó correctamente, es una advertencia de tamaño y la optimización puede planificarse. Si el proceso falló, atender el error específico antes de entregar. |
| Tabla, columna o procedimiento inexistente | La base puede no corresponder a la versión del código. Revisar ajustes con backup; no usar el SQL destructivo de instalación para resolverlo. |
| Sesión perdida | Volver a ingresar y comprobar si la operación anterior se guardó antes de repetirla. Informar al responsable si sucede con frecuencia. |

Información operativa ampliada: [instalación, actualización y recuperación](guia-instalacion-actualizacion.md). Configuración y pruebas del paquete Docker: **pendiente de verificar según empaquetado final**.
