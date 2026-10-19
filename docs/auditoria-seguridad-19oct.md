# Auditoría de seguridad — 19 de octubre de 2026

## Resultado y alcance

El merge de `origin/main` hacia `integracion-main-19oct` quedó confirmado localmente en `a43bf0b`. Sus padres son `0d7c854` y `423611f`. Se conservaron las resoluciones, los consumos por material, las mejoras visuales y los tests adaptados. Se eliminó únicamente un espacio sobrante en `frontend/src/pages/ProduccionDiaria.jsx:90` antes de confirmar.

La integración funcional está verificada. En la continuación se corrigieron en código la firma de sesiones y la autorización contra cuentas vigentes; también se sustituyó el bootstrap inseguro de instalaciones nuevas. **Esto no equivale a haber actualizado una instalación real ni habilita por sí solo una publicación segura en producción**: siguen pendientes configuración privada, contraseñas históricas y los demás riesgos altos descritos abajo. No se cambiaron credenciales, claves, cuentas, permisos de producción ni datos reales.

Inicio del primer bloque: **18:13:19 ART (UTC−3)**; trabajo registrado: 43 minutos y 30 segundos. La continuación autorizada comenzó a las **19:02:53 ART**, con un máximo adicional de 36 minutos y 30 segundos, hasta las 19:39:23 ART. El presupuesto acumulado de trabajo activo es de 80 minutos; la pausa entre bloques no se cuenta como trabajo. Se reservó el cierre para verificación y documentación.

Se revisaron Flask, MySQL/MariaDB, autenticación, sesiones, recuperación, roles, controles de API, React, SQL, configuración Docker, Nginx, Jenkins, scripts de instalación/backup y dependencias declaradas. La revisión de infraestructura fue estática: no se inició Docker, Jenkins, el servidor Flask ni MySQL; no se ejecutaron migraciones, importaciones SQL ni scripts operativos. El daemon Docker no permitió la consulta de imágenes, por lo que no se certifican sus versiones efectivas ni vulnerabilidades del sistema operativo de las imágenes.

Las pruebas HTTP usaron `app.test_client()` y conexiones simuladas. Para la primera ejecución se bloqueó MySQL antes de importar la aplicación y se evitó cargar `.env`. Después se incorporó el bloqueo de conexiones a la propia suite. Las comprobaciones de sesiones vulnerables se realizaron únicamente en memoria y no generaron cookies o secretos en este informe.

Controles existentes que se conservaron:

- Contraseñas verificadas mediante hashes de Werkzeug; códigos de recuperación aleatorios, almacenados como SHA-256 y comparados con `hmac.compare_digest`. La recuperación consume el código bajo una transacción.
- Autenticación y restricciones de borrado/gestión de cuentas en el servidor; modificar un rol en el DOM no sustituye esas verificaciones. Las pruebas existentes preservan las diferencias entre empleado, administrador y maestro.
- Cookie HttpOnly, ausencia de tokens de autenticación en localStorage y renderizado JSX sin encontrar `dangerouslySetInnerHTML`, `eval` o sinks equivalentes en la aplicación revisada.
- MySQL y backend sin puertos publicados directamente en los Compose; valores SQL parametrizados y archivos privados de entorno fuera del inventario versionado revisado.

## Hallazgos originales y estado actual

La gravedad considera el código y la configuración revisados originalmente. Las evidencias históricas de SEC-01/02/03 corresponden al corte `7ecd86b`, anterior a su corrección. Donde la explotación depende de exposición de red, navegador, módulos habilitados o código no confiable en CI, se indica expresamente.

| Hallazgo | Estado tras la continuación |
| --- | --- |
| SEC-01: clave incorporada | Corregido en código; producción exige configuración privada antes del despliegue. |
| SEC-03: sesiones con privilegios/contraseña anteriores | Corregido para cambios de actividad, rol y contraseña; sin migraciones. |
| SEC-02: inicialización insegura | Corregidos el alta de bases vacías y la promoción automática; quedan pendientes las contraseñas históricas que puedan existir. |
| SEC-04 a SEC-10 | Pendientes dentro de los límites y condiciones documentados. |

### SEC-01 — Crítica original: clave de firma predeterminada — corregida en código

- Evidencia original: `backend/app.py` admitía un valor fijo si faltaba `FLASK_SECRET_KEY`. Ninguno de los dos archivos Compose suministraba esa variable al backend. La clave no se reproduce aquí.
- Impacto: quien conoce ese valor puede firmar una sesión con identidad y rol arbitrarios. La autorización confía en el contenido de la cookie.
- Comprobación aislada: una cookie firmada por una instancia Flask independiente, usando el valor predeterminado extraído del código, fue aceptada con estado 200 en `/api/auth/usuarios`. No se accedió a ninguna cuenta real ni se imprimió la cookie.
- Corrección `982ba7d`: se retiró el fallback y se añadió `utils/session_config.py`. Producción exige una clave externa no vacía, de al menos 32 bytes, sin espacios externos ni composición trivial. No es una prueba matemática de entropía: el operador debe generarla criptográficamente. Desarrollo y tests son explícitos y usan claves aleatorias temporales cuando corresponde. Ambos Compose exigen la variable y los ejemplos la dejan vacía.
- Pruebas: diez casos de configuración y una regresión HTTP de la API rechazan cookies firmadas con una clave ajena; una clave privada estable funciona entre instancias. No se usaron secretos reales.
- Pendiente operativo: preparar un secreto privado persistente antes de desplegar y volver a iniciar sesión tras actualizar. No se hizo una rotación ni se alteró la configuración privada. Ver [configuración y compatibilidad](configuracion-sesiones-seguras.md).

### SEC-02 — Alta original: cuentas iniciales — bootstrap corregido, contraseñas históricas pendientes

- Evidencia original: `configurar_admin()` creaba cuentas usando contraseñas fijas y promovía al rol maestro a la cuenta con el nombre reservado, aunque ya existiera.
- Impacto: una instalación nueva puede conservar accesos conocidos. La promoción basada en el nombre también merece una prueba específica de abuso antes de rediseñar el bootstrap.
- Corrección `82883b9`: si hay usuarios, no hay escrituras de cuentas ni ALTER de roles. Si la base está vacía, exige una contraseña inicial privada fuerte de al menos 12 caracteres y crea una única cuenta maestra con hash. Se retiraron las contraseñas incorporadas, las cuentas adicionales y la promoción por nombre. El alta se protege con un bloqueo exclusivo por base y se libera también al fallar; su comportamiento se contrastó con [MySQL GET_LOCK](https://dev.mysql.com/doc/refman/8.4/en/locking-functions.html) y [MariaDB GET_LOCK](https://mariadb.com/docs/server/reference/sql-functions/secondary-functions/miscellaneous-functions/get_lock).
- Pruebas: nueve regresiones de bootstrap verifican cuentas existentes intactas, configuración inicial ausente/débil rechazada, un único INSERT con hash, bloqueo exclusivo y rollback ante errores. No se ejecutó el alta real ni una prueba de concurrencia contra MySQL.
- Pendiente: revisar con sus titulares contraseñas débiles o predeterminadas que ya existan. No se fuerzan cambios ni se pierden cuentas. Una instalación antigua sin maestro conserva acceso con sus roles actuales; elevar una cuenta requiere una intervención autorizada. No se implementó un cambio obligatorio en el primer login ni una migración de usuarios.

### SEC-03 — Alta original: sesiones con permisos anteriores — corregida en código

- Evidencia original: se copiaban identidad y rol a `session` sin revalidar la cuenta; cambiar/restablecer una contraseña tampoco invalidaba las cookies de otros dispositivos.
- Comprobación aislada: después de un login simulado se cambió el registro ficticio a empleado inactivo; `/api/auth/me` siguió devolviendo el rol administrador y no consultó la cuenta.
- Corrección `207cc72`: cada petición protegida, incluido `/api/auth/me`, consulta por ID la cuenta vigente. Usuarios inactivos o eliminados reciben 401; el rol actual sustituye al de la cookie antes de autorizar. Una huella HMAC vinculada al hash de contraseña invalida sesiones anteriores al cambiar o recuperar la contraseña, sin nuevas columnas ni tablas y sin poner ese hash en la cookie. Una falla de MySQL devuelve 503 y conserva la cookie para reintentar.
- Pruebas: 16 regresiones HTTP cubren cuenta existente, eliminación/desactivación, reducción y aumento de rol, degradación de maestro, cambios de nombre, cambio de contraseña en dos dispositivos, recuperación, cookies antiguas/falsificadas, huellas inválidas y fallas de base. Una contraseña existente corta continúa funcionando: la política de alta no se impone retroactivamente sobre cuentas reales.
- Compatibilidad: las cookies de versiones anteriores requieren un nuevo login; no se modifican contraseñas existentes. Quedan como mejoras independientes la revocación individual centralizada tras logout y un límite explícito de inactividad. Una operación que ya pasó la autorización puede terminar aunque la cuenta cambie mientras está en curso. La [guía OWASP de sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) fundamenta la invalidación aplicada.

### SEC-04 — Alta si se usa por red: HTTP y cookies sin Secure

- Evidencia: `frontend/nginx.conf` escucha HTTP; Compose publica `${APP_PORT:-8081}:80` sin limitar la dirección de escucha a loopback. La configuración efectiva aislada tiene `SESSION_COOKIE_SECURE=False`, `SESSION_COOKIE_HTTPONLY=True` y `SESSION_COOKIE_SAMESITE=None`.
- Impacto: el despliegue entregado no protege contraseñas y cookies con TLS cuando se accede desde otra computadora. La exposición real depende también del firewall y de un posible proxy externo, que no se inspeccionaron.
- Pendiente: decidir acceso local o LAN, configurar HTTPS si corresponde y luego ajustar Secure/SameSite y expiración. Activar Secure sin HTTPS dejaría de enviar la cookie: no se cambió automáticamente. Ver las [recomendaciones de Flask](https://flask.palletsprojects.com/en/stable/web-security/#set-cookie-options).

### SEC-05 — Alta condicionada: CORS abierto y ausencia de defensa CSRF explícita

- Evidencia: `backend/app.py:30` usa `CORS_ORIGINS=*` por defecto con credenciales. En la prueba aislada, una preflight desde un origen ajeno recibió autorización para ese origen y credenciales. No hay token CSRF ni validación explícita de Origin para operaciones de escritura.
- Matiz: los Compose sí configuran un origen concreto; la aceptación de cookies en un ataque depende de SameSite y del navegador. El resultado de preflight demuestra la configuración abierta, no una explotación universal desde cualquier sitio. Orígenes distintos del mismo sitio no quedan separados por SameSite.
- Pendiente: lista explícita de orígenes por entorno y protección CSRF compatible con Axios, además de mantener la autenticación de cada operación. Consultar [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### SEC-06 — Alta si CI ejecuta código no confiable: volumen completo de Jenkins

- Evidencia: `Jenkinsfile` monta `jenkins_home:/var/jenkins_home` con escritura en todos los contenedores de instalación, pruebas, lint y build. Ejecuta dependencias y código del repositorio con acceso a ese volumen completo.
- Impacto: una dependencia o cambio malicioso podría leer o alterar otros trabajos y archivos sensibles que estén allí. No se inspeccionó el servidor Jenkins ni se afirma que exista actualmente un atacante o una credencial accesible.
- Pendiente: agentes efímeros, montar solo el workspace necesario, separar secretos y revisar la política de ejecución de ramas/PR. No se cambió la infraestructura de CI.

### SEC-07 — Dependencias con avisos de seguridad

`npm audit --json`, consultado el 19/10/2026, terminó con código 1 por **12 paquetes afectados: 9 high, 2 moderate y 1 low**. Es un inventario de avisos de dependencias; no equivale a 12 vulnerabilidades explotables demostradas en esta aplicación.

| Paquete instalado | Severidad npm | Uso en el lockfile | Evaluación |
| --- | --- | --- | --- |
| axios 1.17.0 | High | Producción | Incluye avisos de adapters Node y de contaminación de prototipos; no se identificó un origen de contaminación en el código React. Revisar y actualizar de forma controlada. |
| react-router 7.17.0 | High | Producción | Avisos de navegación, SSR y RSC; aquí se usa un router de navegador con destinos internos. No se confirmó un destino externo controlado por usuarios. |
| react-router-dom 7.17.0 | Moderate | Producción | Dependencia directa del router afectado. |
| form-data 4.0.5 | High | Producción | Ruta del adapter Node; no se encontró uso de multipart ni ese adapter en el navegador de la app. |
| dompurify 3.4.14 | Low | Producción, transitiva | Los avisos dependen de usos específicos de IN_PLACE/reprocesamiento de HTML; el PDF actual se construye con texto y tablas. |
| baseline-browser-mapping 2.10.34 | Moderate | Desarrollo | Procesamiento de entrada inválida. |
| brace-expansion 5.0.6 | High | Desarrollo | Agotamiento de recursos con patrones manipulados. |
| browserslist 4.28.2 | High | Desarrollo | Entradas/estadísticas manipuladas y consumo de memoria. |
| nanoid 3.3.12 | High | Desarrollo | Generadores con tamaños inválidos. |
| postcss 8.5.15 | High | Desarrollo | Lectura de source maps bajo condiciones concretas. |
| source-map-js 1.2.1 | High | Desarrollo | Agotamiento de recursos con mapas manipulados. |
| undici 7.29.0 | High | Desarrollo | Diversos avisos de red, caché y WebSocket; proviene del entorno de pruebas. |

Referencias concretas verificadas: [Axios y adapter fetch](https://github.com/advisories/GHSA-vh66-26gq-q6x8), [navegación de React Router](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6) y [DOMPurify](https://github.com/advisories/GHSA-6688-9rhm-gjv2). No se usó `npm audit fix --force` ni se actualizó el lockfile.

`pip-audit` consultó, sin resolver ni instalar dependencias de la aplicación, las 11 versiones de `requirements.txt` y las 13 de `requirements-docker.txt`. Ambos inventarios reportaron **Werkzeug 3.1.8 / PYSEC-2026-4312 / CVE-2026-102598**, corregido en 3.1.9. Es un aviso moderado de `safe_join` en Windows/NTFS; el backend Docker usa Linux y no se encontró una ruta propia que sirva archivos con nombres suministrados por usuarios. La ruta estática implícita del framework y los despliegues manuales merecen revisión. [Aviso de Werkzeug](https://github.com/advisories/GHSA-g6x2-hccm-hh4m).

Pendiente: actualizar dependencias en cambios separados, probar rutas afectadas y volver a consultar los feeds. Los avisos altos quedan pendientes de autorización. Esta revisión no comprende todas las dependencias del sistema operativo o del binario PyInstaller.

### SEC-08 — Media: recursos y protección contra intentos repetidos

No hay limitador de intentos en login/recuperación ni límites propios de longitud para todos sus campos. Flask no configura `MAX_CONTENT_LENGTH`. Los listados de varias APIs cargan el conjunto completo; la paginación React no limita el trabajo del servidor. Nginx y Waitress pueden imponer límites propios, que no equivalen a una política de la aplicación.

Pendiente: límites de cuerpo y campos, throttling con almacenamiento compartido y paginación de servidor, con pruebas de carga y compatibilidad. No se simuló un ataque de agotamiento de recursos ni se enviaron solicitudes a servicios reales.

### SEC-09 — Media: DDL dentro de solicitudes y privilegios de base

Varios helpers ejecutan CREATE/ALTER en tiempo de petición; `backend/server.py:8` ejecuta migraciones al arrancar. El bootstrap conserva CREATE TABLE IF NOT EXISTS, pero ya no realiza ALTER de roles ni cambios en cuentas existentes. La revalidación nueva de sesiones solo hace SELECT. Todavía se exigen a la identidad de ejecución permisos más amplios que CRUD y se dificulta separar esquema de negocio. Los GET de sugerencias/historial también pueden escribir metadatos.

Se inspeccionaron **246 llamadas SQL** de controladores, rutas y utilidades. Los valores revisados usan parámetros; los identificadores dinámicos proceden de constantes/listas permitidas o generan placeholders. No se confirmó inyección SQL. Eso no reemplaza pruebas con una instancia desechable de MySQL/MariaDB ni verifica los GRANT reales.

Pendiente: separar identidad de migración y de ejecución, mover DDL fuera de solicitudes y verificar privilegios, transacciones y backups en una base descartable. El SQL inicial contiene `DROP DATABASE`: no se ejecutó ni se debe tratar como una actualización.

### SEC-10 — Media/baja: endurecimiento de navegador, imágenes y operación

- La página React servida por Nginx no tiene política contra framing ni CSP. Las cabeceras añadidas a la API no protegen por sí solas ese documento HTML. Pendiente: probar `frame-ancestors`/X-Frame-Options, CSP compatible con PDFs, Referrer-Policy y TLS.
- Jenkins usa `node:20`, rama marcada EOL en el [calendario oficial de Node](https://nodejs.org/en/about/previous-releases). El Dockerfile de frontend usa Node 22. Unificar en una rama soportada y comprobar la cadena de build.
- La imagen frontend se declara `nginx:1.27-alpine`, sin digest. La [lista oficial de avisos Nginx](https://nginx.org/en/security_advisories.html) contiene correcciones posteriores; la aplicabilidad depende de módulos y configuración. Aquí no se habilitan explícitamente mail, MP4, HTTP/3 ni TLS upstream. No se conoce el digest instalado: no se asigna un CVE concreto al contenedor real sin inspeccionarlo.
- Backend ejecuta como root en su imagen final y no se declaran límites de recursos ni aislamiento adicional. Revisar usuario sin privilegios, filesystem y capacidades en una prueba de despliegue.
- Backups SQL y archivos de entorno se almacenan localmente sin una política de cifrado, ACL y retención definida en el repositorio. No se inspeccionó ni se reprodujo su contenido. Mantenerlos fuera de Git y comprobar restauraciones en una base descartable.

## Correcciones aplicadas y pruebas

### FIX-01 — Aislamiento de pruebas de MySQL

Commit `ceaaadc`. `backend/tests/conftest.py` activa TESTING antes de importar `app`, bloquea conexiones durante esa importación y aplica una fixture automática que rechaza accesos reales a MySQL. Las pruebas existentes pueden seguir sustituyendo conexiones por mocks. Dos regresiones comprueban el driver y el helper con una segunda barrera que impide abrir una conexión incluso si falla el guard del test.

Antes, importar el conftest podía ejecutar el bootstrap contra la base configurada. No se modificó ninguna configuración de producción. Resultado de esa etapa: **80 tests backend aprobados**.

### FIX-02 — Respuestas sensibles sin caché y nosniff

Commit `514f2a3`. Nuevo helper `backend/utils/security_headers.py`, registrado en `backend/app.py`, aplica `Cache-Control: no-store` y `X-Content-Type-Options: nosniff` a las respuestas `/api/`.

Seis regresiones cubren identidad autenticada, sesión ausente, logout 204, código de recuperación, error 500 y rutas ajenas a la API. No se cambian cuerpos ni permisos. Resultado de esa etapa: **86 tests backend aprobados**. No se afirma que estas cabeceras resuelvan CSRF o sesiones falsificables.

### FIX-03 — Errores internos sin detalles SQL

Commit `849a897`. Se reemplazaron mensajes de excepción crudos en las ramas 500 de cuatro controladores: productos, órdenes, lotes y producción diaria. Se conservan las claves JSON, los estados HTTP, rollback y cierre de recursos. Los mensajes de validación y de producto duplicado permanecen intactos.

Las diez regresiones nuevas comprobaron siete rutas con un error sintético: antes de la corrección fallaron las siete por filtración; después pasaron. También verifican duplicados 409 y una validación 400 que no consulta la base. Una comparación del AST contra el merge confirmó que esos cuatro archivos son idénticos fuera de sus manejadores de excepciones. Resultado: **96 tests backend aprobados**, 18 más que la línea base de 78.

## Verificación final

Las verificaciones finales pasaron. Las consultas de dependencias con avisos devuelven código 1 por hallazgos; no se confunden con errores de ejecución ni con una auditoría limpia.

| Comando / comprobación | Resultado |
| --- | --- |
| `npm test -- --maxWorkers=2` desde frontend | Código 0: 173 aprobados, 0 fallidos, 19 archivos; 26,01 s en la continuación |
| `npm run lint` desde frontend | Código 0, sin errores ni advertencias |
| `npm run build` desde frontend | Código 0; advertencia de bundles mayores a 500 kB; 1,20 s en la continuación |
| `python -m pytest backend/tests -q --tb=short` con herramientas temporales y plugins externos desactivados | Código 0: 131 aprobados, 0 fallidos; 6,54 s. Son 35 más que los 96 del primer bloque; sin MySQL real |
| `docker compose --env-file /dev/null ... config --quiet` con valores sintéticos | Código 0 para Compose raíz y paquete; no se iniciaron servicios |
| `git diff --check` y conflictos Git | Sin errores ni conflictos; MERGE_HEAD ya no existe |
| Auditoría npm | 12 paquetes afectados; código 1 esperado |
| Auditoría Python manual / Docker | Un aviso en Werkzeug en ambos inventarios; código 1 esperado |

Pytest y pip-audit se instalaron únicamente en `/tmp/orden-audit-python-tools`; no se cambiaron el venv ni los requirements. La ejecución backend usada desde la raíz fue:

```bash
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=/tmp/orden-audit-python-tools:backend backend/venv/bin/python -m pytest backend/tests -q --tb=short
```

Con pytest instalado en un entorno de desarrollo, el guard incorporado permite ejecutar `python -m pytest` desde backend sin depender del runner temporal. Ninguna prueba se eliminó, se saltó o recibió menos aserciones. No se ejecutó cobertura instrumental; el aumento de casos no implica un porcentaje de cobertura medido.

## Archivos y commits locales

- `a43bf0b`: merge local y resoluciones revisadas; incluye la adaptación previa de mocks y lint. No se volvió a escribir la lógica de producción.
- `ceaaadc`: `backend/tests/conftest.py`, `backend/tests/test_aislamiento_db.py`.
- `514f2a3`: `backend/app.py`, `backend/utils/security_headers.py`, `backend/tests/test_security_headers.py`.
- `849a897`: `backend/controllers/productos_controller.py`, `backend/controllers/ordenes_controller.py`, `backend/controllers/lotes_controller.py`, `backend/controllers/produccion_diaria_controller.py`, `backend/tests/test_errores_api_seguros.py`.
- `7ecd86b`: informe del primer bloque y aviso de pruebas seguras en README.
- `982ba7d`: configuración privada de firma, `backend/utils/session_config.py`, `backend/tests/test_session_config.py`, preparación del entorno de tests, ejemplos privados vacíos, ambos Compose y nueva guía de sesiones.
- `207cc72`: `backend/utils/session_security.py`, middleware Flask, login, persistencia simulada de tests y `backend/tests/test_session_security.py`, sin desactivar la revalidación.
- `82883b9`: bootstrap seguro en `auth_controller.py`, `backend/tests/test_bootstrap_seguro.py`, dos regresiones adicionales de sesiones y documentación/configuración de primeras instalaciones.
- La actualización de este informe se confirma en un commit local final separado.

`AGENTS.md` era un archivo no versionado al comenzar; se conserva intacto y no se añade al índice. No se realizaron push, cambios de rama, operaciones destructivas ni modificaciones sobre la base real.

## Próximo trabajo, en orden

1. Preparar configuración privada y validar el despliegue en una instalación descartable antes de actualizar producción; las correcciones de código de SEC-01/02/03 ya están autorizadas y aplicadas. No se aplicaron a servicios reales.
2. Coordinar la revisión de contraseñas históricas y cuentas antiguas sin maestro, sin sobrescribirlas automáticamente.
3. Definir exposición local/LAN y resolver HTTPS, cookies, CORS y CSRF de forma coordinada.
4. Aislar CI y actualizar dependencias/imágenes por cambios revisables, con nuevas auditorías y pruebas.
5. Ensayar privilegios mínimos, migraciones separadas, límites de recursos, backups y restauración en infraestructura descartable.

El repositorio puede conservar estos commits locales; no se recomienda publicar ni entregar a una red de producción hasta resolver los riesgos críticos y altos aplicables al entorno elegido.
