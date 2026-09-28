# Guía de instalación, actualización, backup y recuperación

Esta guía contempla el **modo desarrollo/local manual** y el **modo empaquetado/entrega con Docker**. La instalación manual se conserva para programar, depurar, diagnosticar y preparar una recuperación si Docker falla; antes de conectarla a los datos de una entrega, verificar configuración, compatibilidad y backup.

Los comandos existentes en esta guía corresponden al modo manual; no son instrucciones para operar dentro de contenedores. Leer cada condición antes de ejecutarlos. Los ejemplos de shell usan Linux/macOS salvo indicación de Windows CMD. Las rutas parten de la raíz del repositorio, excepto cuando se indica otra carpeta.

## Uso con Docker / empaquetado

### Propósito y estado actual

Docker se contempla para entregar backend y frontend preparados con sus dependencias, reducir las instalaciones manuales en la PC cliente y separar el entorno de desarrollo de la entrega. Si el paquete incluye imágenes listas, el cliente puede ejecutar esos componentes sin instalar Python, Node.js o un entorno virtual directamente en su PC. El alcance real del paquete, incluida la ubicación de MySQL, debe confirmarse.

**En esta copia del repositorio no se encontraron Dockerfiles, `docker-compose.yml`, archivos Compose alternativos ni `frontend/nginx.conf`.** La guía de ejecución con Docker queda como **verificar según empaquetado final**. No hay archivos suficientes para respaldar comandos de construcción, arranque, actualización o recuperación de contenedores, ni nombres de servicios o puertos concretos.

La PC cliente necesitará una instalación de Docker compatible con el paquete entregado. Sistema operativo, versión, recursos necesarios y uso de Compose: **verificar según empaquetado final**. La tabla de requisitos de la sección 1 corresponde al modo manual, no a una lista de programas que deban instalarse todos en la PC cliente con Docker.

### Configuración, actualización y datos persistentes

Antes de entregar, confirmar y documentar:

- Los archivos o imágenes incluidos, sus versiones y el procedimiento real para construir o cargar el paquete, levantarlo, detenerlo, reiniciarlo y actualizarlo.
- Las variables de entorno, la provisión de credenciales y la clave de sesión. No asumir que el paquete usa directamente `backend/.env` ni los valores de conexión de la instalación manual.
- Las URL y puertos publicados, la comunicación entre frontend y backend por `/api`, y la conexión con MySQL. No asumir que las direcciones locales y el proxy de Vite de desarrollo son los de la entrega.
- Si MySQL corre en un contenedor o en un servidor externo, cómo se inicializa y cómo se aplican los ajustes de esquema. No asumir que empaquetar activa automáticamente `migrate_db.py`.
- Los **volúmenes de Docker y datos persistentes**: ubicación de los datos de MySQL, montajes, permisos y conservación al reiniciar, recrear o actualizar contenedores. No eliminar volúmenes con datos para resolver un problema de arranque.
- El procedimiento de recuperación si Docker falla, con acceso a una copia verificada de los datos y una versión compatible de la aplicación. La guía manual sirve como alternativa de diagnóstico y recuperación, una vez adaptada la conexión al entorno real.

Todos estos puntos quedan como **verificar según empaquetado final**. Actualizar el código desde GitHub no basta para asegurar que los contenedores estén ejecutando esa versión; el paquete debe especificar cómo actualizar las imágenes y servicios preservando los datos.

### Backups de MySQL con Docker

**Los backups de MySQL siguen siendo necesarios aunque se use Docker.** Un volumen persistente no reemplaza una copia de seguridad. Hacer y verificar un backup antes de actualizar imágenes, aplicar ajustes de base de datos o intervenir sobre los volúmenes.

Si MySQL corre en un contenedor, el backup puede requerir ejecutar la herramienta mediante `docker exec` o acceder desde el equipo anfitrión al puerto de MySQL, si está publicado. El método, nombre del contenedor, herramientas disponibles, usuario, host, puerto y destino del archivo quedan como **verificar según empaquetado final**; por eso no se incluye un comando Docker con nombres supuestos.

Los comandos de `mysqldump` de la sección 4 presuponen acceso desde la shell utilizada a MySQL y deben adaptarse al paquete. Mantener las mismas comprobaciones: ausencia de errores, archivo mayor que 0 bytes, inclusión de los procedimientos necesarios y restauración de prueba. Guardar la copia fuera del contenedor y también en una ubicación protegida independiente de la PC; no subirla al repositorio.

### Checklist de prueba de la entrega con Docker

Ejecutar cuando esté disponible el paquete final, usando datos de demostración y el procedimiento que lo acompañe:

- [ ] **Levantar contenedores:** comprobar que los servicios previstos inicien y revisar sus registros de arranque.
- [ ] **Backend:** verificar su respuesta y conexión a MySQL sin errores, usando la dirección o comprobación definida en el paquete.
- [ ] **Frontend:** abrir la URL de entrega y verificar que cargue y se comunique con el backend.
- [ ] **Login:** ingresar, cerrar sesión y volver a ingresar.
- [ ] **Usuarios:** consultar cuentas y roles con los permisos correspondientes.
- [ ] **Órdenes:** consultar una orden y probar una carga con datos de demostración.
- [ ] **Stock/cuero:** comprobar recepción, consumo y disponibilidad con los casos de la [guía de stock de cuero](flujo-stock-cuero.md).
- [ ] **PDF:** generar y abrir un PDF, revisando datos y legibilidad.
- [ ] **Persistencia de datos tras reiniciar contenedores:** registrar un dato de prueba, reiniciar los servicios según el procedimiento del paquete y comprobar que sigue disponible. Verificar también la conservación al recrear o actualizar contenedores con sus volúmenes; reiniciar por sí solo no comprueba esa situación.
- [ ] **Backup y restauración:** comprobar una copia y su recuperación en un entorno de prueba separado.

Complementar estas pruebas con el checklist funcional de la sección 8. No se ejecutaron contenedores ni se verificó una entrega Docker al redactar esta documentación.

## 1. Requisitos del modo desarrollo/manual

| Herramienta | Qué verificar |
| --- | --- |
| Python y pip | Python 3.12 era la referencia del README. Verificar compatibilidad con `backend/requirements.txt` según la PC. |
| Entorno virtual | Usar `venv` dentro de `backend/` para aislar las dependencias. En algunas distribuciones el soporte de `venv` requiere instalación adicional: verificar según entorno. |
| Node.js | Usar una versión compatible con los requisitos `engines` de las dependencias en `frontend/package-lock.json`. No asumir que cualquier versión antigua sirve. |
| npm | Debe estar disponible junto con Node.js para instalar dependencias y ejecutar los scripts de `frontend/package.json`. |
| MySQL | Servidor activo, base y usuario con permisos adecuados. Tener disponibles los clientes `mysql` y `mysqldump` si se usan comandos de consola. |
| Git | Necesario para clonar y actualizar desde GitHub. |

Las versiones y rutas pueden variar según la PC. XAMPP/phpMyAdmin es una alternativa utilizada en la documentación previa, no un requisito para Linux. Si el entorno usa MariaDB, verificar compatibilidad del servidor y de las herramientas de backup; no se fija aquí una versión mínima no comprobada.

## 2. Instalación local desde cero: modo desarrollo/manual

### Descargar el repositorio

```bash
git clone https://github.com/Lucadisanti/Orden-de-fabricacion.git
cd Orden-de-fabricacion
```

### Preparar una base nueva

Con MySQL iniciado, importar desde una herramienta como phpMyAdmin, en este orden:

1. [bd_orden_fabricacion.sql](modelo_base_datos/bd_orden_fabricacion.sql).
2. [stored_procedures.sql](modelo_base_datos/stored_procedures.sql).

**El primer archivo ejecuta `DROP DATABASE IF EXISTS orden_fabricacion` y recrea la base. Usarlo únicamente para una instalación nueva sin datos que conservar.** Si ya hay una base, ir a las secciones de backup y actualización. La URL de phpMyAdmin depende del entorno; en una instalación habitual de XAMPP es `http://localhost/phpmyadmin`.

El usuario de MySQL que utilizará el backend debe existir y tener los permisos necesarios sobre esa base, incluidos los ajustes de esquema que realiza la aplicación. La creación de ese usuario y sus permisos quedan como **verificar según entorno**. Los archivos de instalación no crean una cuenta MySQL llamada `orden_user`.

### Instalar el backend

Desde la raíz, en Linux/macOS:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Alternativa en Windows CMD, desde la raíz, si está instalado el lanzador de Python 3.12:

```bat
cd backend
py -3.12 -m venv venv
venv\Scripts\activate.bat
python -m pip install -r requirements.txt
copy .env.example .env
```

Copiar `.env.example` solamente si todavía no existe `.env`. En una actualización, conservar la configuración local.

### Configurar `backend/.env`

Editar el archivo antes de iniciar el backend. La plantilla existente contiene:

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=orden_fabricacion
DB_PORT=3306
```

Es una plantilla, no una garantía de acceso: reemplazar usuario, contraseña, host y puerto por los de la instalación. Si se usa `orden_user`, debe ser una cuenta MySQL ya configurada. La contraseña de MySQL es distinta de la contraseña de login de la aplicación.

El backend también lee `FLASK_SECRET_KEY`; para uso real, agregar una clave secreta propia en `.env`, distinta del valor predeterminado del código. No publicar el archivo ni sus valores. `.env` ya está ignorado por Git.

### Iniciar el backend

Desde `backend/`, con el entorno virtual activado:

```bash
python app.py
```

Normalmente escucha en `http://127.0.0.1:5000`. Abrir esa URL permite comprobar la respuesta de estado; las rutas funcionales usan `/api`. Revisar que la terminal no muestre errores de conexión ni de esquema.

El arranque necesita una base accesible y ejecuta ajustes de usuarios y roles. No sustituye la preparación de la base ni todas las migraciones. Si la base proviene de otra versión, seguir la sección 5 antes de operar. El comando inicia el servidor de desarrollo de Flask; este procedimiento cubre desarrollo local; el arranque de la entrega Docker depende del empaquetado final.

### Instalar e iniciar el frontend

En otra terminal, desde la raíz:

```bash
cd frontend
npm install
npm run build
npm run dev
```

Abrir la URL que muestre Vite, normalmente `http://127.0.0.1:5173`. El proxy de desarrollo definido en `frontend/vite.config.js` envía `/api` a `http://127.0.0.1:5000`. No hay una variable `VITE_API_URL` configurada en ese archivo. Mantener activos MySQL, backend y frontend.

## 3. Actualizar desde GitHub: modo desarrollo/manual

Para una entrega con Docker, seguir además el procedimiento de actualización del paquete final; esta secuencia por sí sola no actualiza sus imágenes ni contenedores.

1. Coordinar una pausa de uso y guardar el trabajo local. Antes de arrancar código actualizado que pueda ajustar la base, hacer y comprobar un backup según la sección 4. Si no está claro si hay cambios de base de datos, hacer backup igualmente.
2. Desde la raíz, revisar la rama actual y los cambios locales:

   ```bash
   git status
   ```

   No continuar con cambios sin resguardar o un merge anterior sin resolver. El siguiente merge incorpora `origin/main` en **la rama actual**: verificar que sea la rama que se pretende actualizar; no cambia de rama automáticamente.

3. Descargar las referencias y combinar los cambios:

   ```bash
   git fetch origin
   git merge origin/main
   ```

   Si `origin/main` no existe en ese entorno, verificar el remoto y la rama de integración con el equipo. No sustituirlos por nombres supuestos.

4. Si hay conflictos, detener la actualización. Usar `git status`, revisar cada archivo, resolver los bloques marcados y marcar como resueltos únicamente los archivos revisados mediante Git. Completar el merge según las instrucciones de Git antes de continuar. No elegir todo «local» o «remoto» a ciegas ni descartar trabajo para forzar el proceso. Un merge puede generar un commit de integración; esta guía describe el procedimiento, no lo ejecuta.
5. Detener los procesos de desarrollo antes de actualizar dependencias. Desde `backend/`, activar el entorno virtual y ejecutar:

   ```bash
   python -m pip install -r requirements.txt
   ```

6. Desde `frontend/`:

   ```bash
   npm install
   npm run build
   ```

7. Revisar los cambios de esquema según la sección 5, iniciar el backend actualizado y luego el frontend con `npm run dev`. Completar el checklist de la sección 8.

## 4. Backup y restauración de la base de datos

Las comprobaciones de backup y restauración se aplican a ambas modalidades. Si MySQL corre en Docker, adaptar el acceso y la ubicación de los archivos según «Uso con Docker / empaquetado».

### Crear y comprobar el backup

Hacerlo **antes** de migraciones, importaciones o del primer arranque de una versión que ajuste datos. Evitar escrituras durante la copia. Desde la raíz, en Linux/macOS o una shell compatible, crear `backups/` si no existe:

```bash
mkdir -p backups
```

Comando utilizado por el equipo:

```bash
mysqldump --no-tablespaces -u orden_user -p orden_fabricacion > backups/backup_orden_fabricacion_FECHA.sql
```

Reemplazar `FECHA` por una fecha y hora identificables, por ejemplo `2026-09-28_1530`, y no reutilizar un nombre existente: `>` sobrescribe el archivo. `-p` solicita la contraseña de MySQL sin escribirla en el comando. Verificar usuario, base, host y puerto según entorno; `--no-tablespaces` no corrige una contraseña ni concede permisos.

Después de ejecutar, revisar que no haya errores y comprobar el tamaño:

```bash
ls -lh backups/backup_orden_fabricacion_FECHA.sql
```

Usar el mismo nombre real en ambos comandos. **Un archivo de 0 bytes no es un backup válido.** Un archivo mayor que cero tampoco garantiza que la copia esté completa: revisar errores, contenido SQL y comprobar una restauración en un entorno de prueba separado.

El comando del equipo no incluye por defecto los procedimientos almacenados. Como esta aplicación los utiliza, para una copia que también incluya rutinas y eventos, con los permisos necesarios, puede usarse:

```bash
mysqldump --no-tablespaces --routines --events -u orden_user -p orden_fabricacion > backups/backup_orden_fabricacion_completo_FECHA.sql
```

Verificar según entorno la compatibilidad y permisos de estas opciones. Si solo se dispone de la copia básica, conservar también los procedimientos correspondientes a **la versión respaldada**; no asumir que el SQL de una versión posterior es intercambiable.

No subir backups al repositorio: pueden contener datos personales, hashes y datos de producción. `backups/` **ya está en `.gitignore`** en esta copia; comprobarlo en otras instalaciones. La exclusión no afecta archivos previamente versionados. Guardar además una copia protegida fuera de la PC del sistema y anotar fecha y versión del proyecto asociadas.

En Windows, verificar la disponibilidad de `mysqldump` y la shell utilizada. `mkdir -p` y `ls -lh` son ejemplos para Linux/macOS; en CMD puede crearse y revisarse la carpeta desde el Explorador. Verificar la codificación de las redirecciones si se usa PowerShell.

### Recuperar una base desde backup

1. Detener el backend y evitar nuevas cargas. Identificar la copia correcta y el estado del proyecto al que corresponde. Si hay datos posteriores al backup, preservarlos antes de reemplazar la base.
2. Revisar el SQL: puede borrar/recrear tablas y contener nombres de base, rutinas o definidores propios del servidor de origen. Restaurar primero en un entorno separado y compatible. No importar en producción para «probar» si funciona.
3. Seleccionar la base destino en una herramienta como phpMyAdmin e importar la copia verificada. La preparación del destino, los permisos y el tratamiento de definidores quedan como **verificar según entorno**. Revisar todos los errores de importación.
4. Confirmar que se recuperaron tablas, datos y procedimientos almacenados. Si la copia básica no contiene rutinas, recuperar las de la misma versión; no ejecutar el SQL de instalación que borra la base.
5. Iniciar el backend correspondiente a esa versión con su configuración y realizar el checklist de la sección 8. Revisar usuarios, cantidades y registros conocidos antes de reabrir el uso.

Volver a una versión anterior del código no revierte automáticamente la base. La restauración reemplaza información por la de la fecha del backup y debe coordinarse con el responsable de los datos.

## 5. Actualizar la base de datos

Los comandos de esta sección corresponden al modo manual. En Docker, confirmar cómo y dónde se realizan estos pasos según el empaquetado final, sin asumir que el arranque del contenedor ejecuta todas las migraciones.

**Siempre hacer backup antes.** No importar todos los archivos SQL de `docs/modelo_base_datos/` ni usar `bd_orden_fabricacion.sql` sobre una instalación con datos.

El comportamiento comprobado en el código es:

- `backend/app.py` llama a `configurar_admin()` al cargar la aplicación. Crea las tablas de usuarios y control de migraciones si faltan, ajusta roles e incorpora usuarios iniciales cuando corresponde.
- Algunos controladores aseguran columnas o tablas al atender solicitudes, por ejemplo en Productos, Órdenes y Recepción de cortes. Por eso conviene tener backup antes del arranque y de abrir pantallas tras actualizar.
- Existe `backend/migrate_db.py`, que llama a `migrate_schema()` de `backend/db/migrations.py`. **No se invoca automáticamente desde `app.py`.** Realiza ajustes adicionales de esquema y actualiza procedimientos; no crea una instalación completa desde una base inexistente.

Si la revisión de la versión y de la base confirma que corresponde ejecutar ese script, detener el backend, verificar el backup y, desde `backend/` con el entorno virtual activado, ejecutar:

```bash
python migrate_db.py
```

Revisar su salida antes de continuar. No asumir que un fallo deja todos los cambios revertidos. Para bases antiguas, verificar primero los prerrequisitos de tablas y columnas; el orden exacto depende del estado previo y queda como **verificar según entorno**.

También existen las migraciones históricas [talles por orden](modelo_base_datos/migracion_talles_por_orden_2026-08-19.sql) y [códigos de producto](modelo_base_datos/migracion_codigos_producto_2026-08-28.sql). El README anterior las indicaba como pasos manuales de versiones específicas. No repetirlas por rutina ni suponer que todos sus efectos se aplican al iniciar el backend; revisar con el responsable cuáles faltan en esa base.

Después de los ajustes que correspondan, levantar el backend actualizado con `python app.py`, comprobar que arranque sin errores, probar login y abrir las pantallas principales. Si aparecen errores de tabla, columna o procedimiento inexistente, detener la puesta en uso y revisar la versión del esquema.

## 6. Usuarios iniciales

Estas cuentas están definidas en `backend/controllers/auth_controller.py`:

| Usuario (respetar mayúsculas) | Contraseña inicial | Rol |
| --- | --- | --- |
| `Admin` | `Admin1234` | Maestro |
| `Ariel_disanti@bohm.com` | `Admin1234` | Administrador |
| `Usuario` | `Admin1234` | Empleado |

Son credenciales iniciales/de demostración y **deben cambiarse para uso real** desde Usuarios, con los permisos correspondientes. No son credenciales de MySQL.

La carga inicial se registra con `usuarios_iniciales_v1` y conserva cuentas existentes con el mismo usuario. Reiniciar no restablece sus contraseñas. En bases ya utilizadas, estas credenciales pueden no ser válidas o las cuentas pueden haber cambiado. El login distingue mayúsculas y minúsculas en el usuario.

## 7. Recuperación de acceso

### Preparar un código mientras hay acceso

Con la cuenta maestra activa, entrar en **Usuarios** y pulsar **Generar código** en la cuenta maestra. Copiarlo y guardarlo fuera del repositorio en un lugar seguro. Generar otro reemplaza al anterior; el código no se envía por correo en el flujo implementado.

### Desde la pantalla de login

1. Pulsar **¿Olvidaste la contraseña?**.
2. Ingresar el usuario de la cuenta maestra activa, su **Código de recuperación** y una **Nueva contraseña** de al menos 8 caracteres.
3. Pulsar **Cambiar contraseña**.
4. Tras la confirmación, ingresar con la nueva contraseña. El código utilizado queda invalidado; generar y guardar uno nuevo cuando se recupere el acceso.

Este flujo con código es para cuentas de rol `maestro`, no para cualquier usuario. Para otras cuentas, una persona con permisos de gestión debe usar **Usuarios → Cambiar contraseña**, respetando los permisos del sistema.

### Si no hay código o no se puede acceder a la cuenta maestra

**Pendiente: recuperación local sin código.** El login menciona «Recuperar acceso administrador» en la PC instalada, y `backend/tests/test_recuperacion_local.py` referencia `entrega-cliente/scripts/recuperar-admin.py`. Ni ese script ni la carpeta `entrega-cliente/` están presentes en esta copia del repositorio. No hay un comando local de recuperación verificado para indicar aquí.

Verificar con el responsable si la instalación dispone de un paquete adicional que lo incluya. Hasta comprobarlo, no asumir que ese acceso directo existe ni que reiniciar el backend restaura `Admin1234`. No recrear la base ni borrar usuarios para intentar recuperar el acceso.

## 8. Pruebas básicas después de actualizar

Usar datos de demostración en un entorno de prueba para las operaciones que escriben información. En la instalación real, comenzar con consultas y comparar registros conocidos.

- [ ] **Login:** ingresar, cerrar sesión y volver a ingresar con una cuenta válida.
- [ ] **Usuarios:** consultar cuentas y roles con permisos de gestión; probar un cambio de contraseña en una cuenta de prueba.
- [ ] **Productos:** consultar listado, búsqueda y datos de un producto existente.
- [ ] **Recepción de materiales:** abrir recepciones y comprobar cantidades y disponibilidad conocidas.
- [ ] **Órdenes:** consultar una orden, sus talles y cantidades; probar una carga con datos de demostración.
- [ ] **Planillas:** abrir R013 y R013/1 y verificar su relación con la orden.
- [ ] **Producción diaria:** consultar registros y comprobar totales; probar una carga en el entorno de prueba.
- [ ] **Recepción de cortes:** consultar registros y verificar cantidades por talle.
- [ ] **Uso de materiales:** verificar vínculos y cantidades registradas, sin duplicar consumos para probar.
- [ ] **Trazabilidad:** consultar una orden o lote conocido y comprobar sus relaciones.
- [ ] **PDF:** generar un PDF desde una pantalla que lo permita y revisar datos, totales y legibilidad.
- [ ] **Estadísticas:** abrir la pantalla y contrastar los resultados con datos conocidos.
- [ ] **Registros y compilación:** comprobar ausencia de errores en backend y frontend. En modo manual, ejecutar `npm run build` desde `frontend/`; en Docker, verificar la construcción y los registros según el empaquetado final.

## 9. Problemas frecuentes

Las rutas, puertos y comandos de arranque de la tabla corresponden al modo manual. En Docker, revisar los registros, servicios y conexiones definidos por el paquete final; no iniciar una segunda instalación manual contra los mismos datos sin revisar antes su configuración.

| Problema | Qué revisar |
| --- | --- |
| MySQL: `Access denied` | Usuario, contraseña, host, puerto y permisos reales en `backend/.env`. La cuenta `orden_user` no se crea con el login. En el backup, `-p` pide la clave de MySQL. `--no-tablespaces` no resuelve errores de autenticación. |
| Backup de 0 bytes | Leer el error de `mysqldump`, comprobar que el cliente exista, la carpeta sea escribible y MySQL sea accesible. La redirección puede crear un archivo vacío aunque falle la conexión. Repetir con un nombre nuevo y revisar con `ls -lh`; no usar el archivo vacío para restaurar. |
| Backend apagado | Activar `venv`, ejecutar `python app.py` desde `backend/` y mantener abierta la terminal. Confirmar que MySQL esté encendido y resolver el primer error de arranque. |
| Frontend no conecta al backend | Comprobar `http://127.0.0.1:5000`, el proxy `/api` de `frontend/vite.config.js` y los mensajes de ambas terminales. Usar la URL indicada por `npm run dev`; abrir el HTML compilado directamente no configura la API. Para otra PC o un despliegue, verificar red y proxy según entorno. |
| Conflictos de Git | Detener la actualización, revisar `git status`, resolver archivo por archivo y completar la integración antes de instalar o iniciar. No descartar cambios locales sin revisarlos. |
| `npm run build` advierte sobre un bundle grande | Distinguir advertencia de error: si la compilación finaliza con éxito, la advertencia de tamaño por sí sola no implica un fallo. Registrar la optimización como pendiente; no cambiar configuración o código como parte de esta guía. Si el proceso termina con error, revisar ese error concreto. |
| Tabla, columna o procedimiento inexistente | Revisar si la base corresponde a la versión del código y si falta un ajuste de la sección 5. No importar el SQL que elimina la base para resolverlo. |
| Usuario inicial no permite ingresar | Respetar mayúsculas y verificar si la contraseña fue cambiada o la cuenta está inactiva. Usar el flujo de recuperación correspondiente; reiniciar no restablece contraseñas. |

## 10. Enlaces y pendientes

- [README del proyecto](../README.md).
- [Flujo de stock de cuero](flujo-stock-cuero.md).
- [Documento del proyecto](proyecto_orden_fabricacion.docx).
- [Modelo y archivos SQL](modelo_base_datos/): contienen instalación, ajustes históricos y material de prueba; su presencia no indica que deban ejecutarse todos.

Pendientes por entorno: versiones concretas de herramientas, permisos de MySQL, migraciones necesarias según el estado previo de la base, restauración comprobada del backup y disponibilidad del paquete de recuperación local. Para Docker también quedan pendientes los archivos del paquete, requisitos, comandos de operación y actualización, red, puertos, variables, ubicación de MySQL, volúmenes persistentes y pruebas de recuperación. Todo ello debe verificarse según empaquetado final. No se verificaron mediante una instalación o una restauración real al redactar esta guía.
