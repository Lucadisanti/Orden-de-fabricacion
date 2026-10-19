# Cierre de seguridad y preparación de entrega — 19/10/2026

## Decisión de entrega

La integración está confirmada localmente y las pruebas pasan. **La entrega de producción todavía tiene condiciones pendientes**. No se desplegó, no se modificaron archivos privados y no se consultó MySQL. Este documento complementa la [auditoría](auditoria-seguridad-19oct.md) y la [configuración de sesiones](configuracion-sesiones-seguras.md); sus requisitos de seguridad deben atenderse antes de seguir los comandos de instalación de los manuales anteriores.

## Corregido y probado durante la sesión

- Merge de main, resoluciones de conflictos, consumos por material y mejoras del cliente conservados.
- Pruebas backend con conexiones reales bloqueadas antes de importar la aplicación y durante cada caso.
- Respuestas de API sin caché y con `nosniff`; errores internos de cuatro controladores sin detalles de excepciones SQL.
- Producción exige una clave externa; desarrollo y pruebas requieren modo explícito. `TESTING=1` no permite omitir la clave en production.
- Cada petición protegida consulta actividad y rol vigentes. Cambiar o recuperar contraseña invalida las cookies anteriores mediante una huella HMAC. Las pruebas incluyen cookies falsificadas y dos dispositivos.
- Una base vacía exige una contraseña inicial privada; una base con usuarios conserva cuentas, roles y contraseñas, sin promociones por nombre.
- Cuatro pruebas finales ejecutan el punto de entrada `app.py` con servidor y bootstrap sustituidos por mocks: desarrollo y producción configurados responden en memoria; producción sin clave o con clave corta falla antes del bootstrap y del servidor.

No se certificó un despliegue completo: esas pruebas no abren sockets, no ejecutan el bootstrap real ni migraciones. El venv local no incluye Waitress; está declarado en `requirements-docker.txt`. No se construyeron ni ejecutaron las imágenes y no se probó el binario PyInstaller. Instalar los requisitos de producción y ensayar su imagen en infraestructura descartable sigue siendo necesario.

## Pendientes obligatorios antes de producción

| Requisito | Criterio de aceptación |
| --- | --- |
| Claves privadas y acceso legítimo | Configuración persistente fuera de Git, contraseña inicial solo para base vacía y procedimiento de recuperación disponible. Revisar contraseñas históricas conocidas con los titulares. |
| Transporte y exposición | Para cualquier acceso por red: HTTPS válido y cookies Secure, HttpOnly y SameSite compatibles. La publicación actual escucha en todas las interfaces. Si se declara uso solo local, restringir escucha/firewall a loopback y comprobarlo; no asumir que `localhost` en el manual limita Docker. |
| CORS y CSRF | Sustituir el wildcard del backend manual por una lista explícita. Configurar el origen real del cliente, no conservar localhost para una URL LAN. Implementar y probar defensa CSRF en escrituras; CORS y SameSite por sí solos no cubren todos los casos. |
| Autorización | Validar con el cliente la matriz maestro/admin/empleado y ensayar permisos en staging. Una instalación antigua sin maestro no recibe una promoción automática. |
| Cadena de dependencias | Resolver o aceptar formalmente, con análisis de aplicabilidad, los avisos altos del inventario. Actualizar componentes afectados en commits separados y repetir pruebas/auditorías. No afirmar que los 12 paquetes afectados son 12 explotaciones demostradas. |
| Jenkins, si se usa para la entrega | Aislar el workspace del volumen completo de Jenkins, impedir ejecución de código no confiable con secretos y reemplazar Node 20 EOL por una rama soportada. No se inspeccionó la instancia real. |
| Imágenes y actualización | Ensayar arranque, backup, restauración y rollback en una base descartable; revisar los defectos de scripts descritos abajo. Usar una versión nueva e inequívoca para las tres imágenes. |
| Datos y esquema | Mantener volumen y credenciales existentes; comprobar permisos y esquema soportado. El arranque `server.py` ejecuta `migrate_schema()` y el bootstrap conserva DDL: requieren una ventana y validación autorizadas. No se ejecutaron aquí. |

Para exposición a Internet son además indispensables límites de intentos de login/recuperación y una revisión de límites de solicitudes. Antes de usar backups y archivos privados reales deben estar definidos acceso restringido, almacenamiento protegido y una restauración ensayada.

## Docker y scripts: conclusiones de la revisión estática

- Los Compose mantienen volúmenes de datos; los scripts revisados de parada usan `down` sin `-v`. No se encontró borrado explícito del volumen en los scripts de actualización. Esto no garantiza una actualización sin fallos.
- La imagen de base copia SQL de inicialización. Ese SQL contiene `DROP DATABASE`: nunca debe ejecutarse como actualización manual. El mecanismo de inicialización de la imagen se reserva a un directorio de datos nuevo; no cambiar el volumen para intentar solucionar un arranque.
- El empaquetador copia ejemplos y archivos del programa; no copia deliberadamente `.env.cliente` ni backups. Cambia las etiquetas del ejemplo, no las credenciales del archivo privado. Backend excluye `.env` del contexto Docker y frontend excluye `.env*`; revisar que no haya otros archivos privados dentro de los contextos de build.
- **SEC-11A, riesgo de sobrescritura:** `scripts/iniciar.ps1` verifica `$EnvFile`, pero cuando falta copia el ejemplo siempre a `.env.docker`. Con un parámetro alternativo inexistente puede sobrescribir un `.env.docker` existente. También anuncia éxito sin comprobar el código de salida de Docker. No usar ese parámetro ni ese arranque para una entrega hasta corregirlo y probarlo en PowerShell. Solución propuesta: crear exclusivamente el destino solicitado si no existe, sin sobrescritura, y verificar `$LASTEXITCODE` inmediatamente después de Compose.
- **SEC-11B, actualización parcial:** `entrega-cliente/scripts/actualizar-paquete.ps1` comprueba solo el último resultado del conjunto de `docker load`. Un fallo anterior puede quedar oculto. Carga además todos los tar, aunque validó tres de una versión concreta. Debe cargar únicamente esos tres y detenerse ante cada fallo, antes de modificar el entorno o arrancar servicios.
- El actualizador del paquete reemplaza solo las tres líneas de etiquetas de imágenes, pero reescribe el archivo privado completo con `Set-Content -Encoding UTF8`, antes de confirmar el arranque. Puede cambiar BOM/saltos de línea y deja las etiquetas nuevas si Compose falla. Exigir escritura temporal validada y reemplazo seguro, copia privada recuperable y rollback ensayado; no certificar que nunca altera configuración.
- Los backups también pasan por Compose: con los nuevos archivos, una clave ausente impide incluso preparar el servicio database. Hacer primero un backup con la versión instalada y su procedimiento vigente, antes de reemplazar el paquete; preparar luego la clave nueva. El backup automático del actualizador no sustituye ese resguardo previo.
- El empaquetador tiene una versión predeterminada antigua. Pasar explícitamente una versión nueva: reutilizar etiquetas puede impedir que el abridor detecte la actualización. Mantener solamente los tres archivos de la entrega elegida en el directorio utilizado para actualizar.

No se ejecutaron estos scripts: PowerShell no está disponible en este entorno. Los defectos quedan pendientes de corrección y pruebas operativas, sin arriesgar datos para verificarlos. Probar en Windows los fallos de cada carga, configuración inválida, rutas alternativas, contraseñas con caracteres especiales y recuperación tras fallo de arranque.

## Pasos para una puesta en marcha segura

Estos pasos son para el operador en una intervención posterior autorizada; **no fueron ejecutados sobre una instalación**. No iniciar la fase de arranque hasta cumplir los requisitos anteriores.

1. Identificar instalación nueva o existente, URL definitiva, volumen actual y responsables. Para actualización, obtener backup con el programa instalado, comprobar su restauración en otra base, y resguardar privadamente entorno y etiquetas anteriores. No borrar ni renombrar el volumen original.
2. Elegir una entrega con versión nueva, tres imágenes verificadas y requisitos de producción instalados. Ensayar esa misma entrega y su recuperación en staging. Usar scripts corregidos y probados; no confiar todavía en la actualización automática señalada arriba.
3. Editar el archivo privado correspondiente, sin reemplazarlo por el ejemplo si ya existe. Generar los valores con un gestor de contraseñas/secretos o CSPRNG, sin imprimirlos ni pegarlos en logs. Una representación hexadecimal de 32 bytes aleatorios sirve para la clave; no reutilizar esa clave como contraseña.

| Variable | Configuración |
| --- | --- |
| `FLASK_SECRET_KEY` | Secreto aleatorio privado, al menos 32 bytes; persistente e idéntico entre réplicas. Los ejemplos dejan el campo vacío deliberadamente. |
| `ORDEN_INITIAL_ADMIN_USER` | Solo primera instalación: nombre de 3 a 60 caracteres; opcional, predeterminado `Admin`. |
| `ORDEN_INITIAL_ADMIN_PASSWORD` | Solo si no hay usuarios: contraseña aleatoria privada, al menos 12 caracteres y 8 distintos, sin espacios externos. No recupera ni reemplaza cuentas existentes. |
| `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` | Instalación nueva: valores privados distintos. Instalación existente: conservar exactamente los ya vigentes; cambiarlos en Compose no cambia las cuentas de una base inicializada. |
| `ORDEN_DATA_VOLUME` | Paquete: conservar el volumen de la instalación; omitirlo usa `orden_fabricacion_datos`. Nunca cambiarlo para crear involuntariamente otra base. |
| `ORDEN_*_IMAGE`, `APP_PORT` | Paquete: etiquetas verificadas de una misma versión y puerto disponible; preservar el puerto existente salvo cambio coordinado. |
| `ORDEN_ENV`, `TESTING` | Backend manual de producción: `ORDEN_ENV=production` y `TESTING` ausente. Los Compose usan production por defecto y no propagan estos dos indicadores. |
| `CORS_ORIGINS` | Backend manual: lista explícita del origen del frontend. Compose fija localhost:puerto; una URL distinta requiere adaptar y probar esa configuración. |

4. Validar sin iniciar servicios ni imprimir el entorno resuelto. Desde la raíz del repositorio: `docker compose --env-file .env.docker config --quiet`. Desde el paquete: `docker compose -f compose.yaml --env-file .env.cliente config --quiet`. Este chequeo no comprueba conexión a DB, contraseña inicial, fortaleza de la clave, TLS ni estado del esquema.
5. Con todos los bloqueantes resueltos y una ventana autorizada, arrancar la entrega ensayada. En el paquete, tras cargar y verificar individualmente sus imágenes: `docker compose -f compose.yaml --env-file .env.cliente up -d`. Este comando inicia servicios y puede ejecutar migraciones; no es una comprobación inocua. Mantener el plan de rollback y el backup disponible.
6. Comprobar HTTPS y cookies, login, `/api/auth/me`, permisos de los tres roles, órdenes, consumos y stock. Ensayar desactivación y cambio de rol/contraseña con cuentas de prueba de staging, no con usuarios reales sin autorización. Ante errores, detener la actualización y diagnosticar; no recurrir al fallback antiguo ni borrar volúmenes.
7. En una instalación nueva, verificar acceso legítimo y recuperación. Retirar luego solo la variable de contraseña inicial en mantenimiento, conservando la clave de sesión y el resto de credenciales. No guardar el secreto inicial en el paquete distribuido.

Para desarrollo en una base **descartable**, configurar sus `DB_*`, `ORDEN_ENV=development`, origen explícito y contraseña inicial si está vacía. Desde backend, `ORDEN_ENV=development python app.py`; desde frontend, `npm run dev` (proxy `/api` hacia 127.0.0.1:5000). El arranque normal puede hacer DDL/bootstrap: no apuntarlo a la base real para comprobar configuración. La clave temporal de desarrollo cambia tras reiniciar.

## Riesgos y compatibilidad de los cambios

- Sin clave privada válida, producción no inicia: rechazo deliberado, preparar configuración antes de actualizar.
- Todas las cookies antiguas requieren login. Rotar la clave vuelve a invalidar sesiones; no regenerarla en cada reinicio.
- La nueva consulta por petición aumenta carga y dependencia de MySQL. Una falla devuelve 503 sin borrar la cookie; comprobar capacidad en staging.
- Usuarios existentes conservan contraseñas incluso si son débiles. La política nueva de bootstrap no se aplica retroactivamente. No hay recuperación por configurar una contraseña inicial.
- El bloqueo de bootstrap requiere soporte y permisos de `GET_LOCK`/`RELEASE_LOCK` en la versión destino; está probado con mocks, no con concurrencia real.

## Mejoras posteriores

Revocación centralizada de una sesión robada después de logout, caducidad por inactividad, CSP/framing, paginación de servidor, usuario de contenedor sin privilegios y separación de identidad de migración. Priorizar cada una según la exposición elegida. La revocación por desactivación, rol y contraseña ya funciona; logout todavía solo borra la cookie del navegador. Una operación que pasó la autorización puede terminar mientras cambia el usuario.

## Verificación de cierre

- Backend: **137 aprobados, 0 fallidos**, incluidos cuatro nuevos casos de arranque; 6,92 s, driver MySQL bloqueado.
- Frontend: **173 aprobados, 0 fallidos**, 19 archivos; `npm test -- --maxWorkers=2`, 28,30 s.
- `npm run lint`: código 0, sin errores. `npm run build`: código 0, advertencia conocida de bundle mayor a 500 kB.
- Ambos Compose: configuración sintética válida aceptada y ausencia de clave rechazada; sin daemon ni servicios.
- No se repitieron los feeds de dependencias consultados durante esta misma sesión; persisten los avisos de la auditoría, no se declara inventario limpio.
- Commit de pruebas finales: `1df47f5`. La documentación de cierre se confirma aparte. No hay push ni despliegue.
