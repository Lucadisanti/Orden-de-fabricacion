# Guía de presentación y demo del sistema Orden de Fabricación

Guion para presentar el sistema a un profesor o a una empresa. El recorrido describe funciones presentes en el proyecto; los ejemplos requieren preparar y ensayar datos de demostración. Esta guía no crea datos ni ejecuta la aplicación.

## 1. Objetivo de la presentación

Explicar cómo la aplicación ayuda a organizar la fabricación de calzado: relaciona productos, recepción de materiales, órdenes por talle, recepción de cortes, planillas y producción registrada. Permite consultar los materiales asociados a las órdenes, la disponibilidad de cuero, la trazabilidad y los resultados de producción.

Apertura sugerida:

> «Vamos a seguir una orden de calzado desde la recepción del material hasta su producción y consulta final. El objetivo es tener la información vinculada, saber qué se planificó, qué se produjo y qué materiales se registraron, y poder mostrarlo en pantalla y en un PDF».

El valor a mostrar es concreto: orden en las cargas, relación entre etapas, seguimiento de producción, consulta de materiales y stock/cuero, trazabilidad por orden y reportes. No presentar la aplicación como una gestión integral de compras, costos o inventario: esos alcances no están demostrados por este recorrido.

## 2. Preparación antes de mostrar

Completar antes de que llegue el público:

- [ ] **MySQL prendido** y accesible con la configuración de la instalación.
- [ ] **Base actualizada** y compatible con esta versión, con sus ajustes ya revisados. No ejecutar migraciones durante la demo.
- [ ] **Backup hecho y verificado** antes de preparar datos o arrancar una versión que ajuste la base. Comprobar errores, tamaño mayor que 0 bytes y disponer de una recuperación probada según la [guía operativa](guia-instalacion-actualizacion.md).
- [ ] **Backend prendido**, sin errores en la terminal; en modo manual, comprobar `http://127.0.0.1:5000`.
- [ ] **Frontend prendido** y navegador abierto en la dirección que indique Vite; normalmente `http://127.0.0.1:5173` en modo manual.
- [ ] **Usuario de prueba listo**, activo, con credenciales y permisos ensayados.
- [ ] **Navegador con zoom normal (100 %)** y tamaño de ventana legible para la proyección. Probar modo claro/noche si se desea mostrarlo; no es obligatorio alternarlos durante el circuito.
- [ ] **Datos demo preparados** y números de orden/remito anotados para encontrarlos sin improvisar.
- [ ] **PDF y estadísticas ensayados**, con registros que tengan producción y fechas dentro del período a mostrar.

En desarrollo/manual, comprobar previamente `npm run build` y arrancar el frontend con `npm run dev`, ambos desde `frontend/`. Para el backend, usar `python app.py` desde `backend/` con el entorno virtual activado, como indica la guía operativa. Esta preparación se hace antes de presentar.

Si se presenta una entrega Docker, verificar los servicios y direcciones del paquete disponible. Los comandos y comprobaciones específicos quedan como **verificar según empaquetado final**; no prometer un arranque Docker que todavía no se haya probado.

### Datos mínimos para ensayar

Preparar en una base de demostración un producto con consumo de cuero `0.25`, sus catálogos ya configurados, un proveedor, un material cuyo nombre contenga «cuero» y una recepción de 10 unidades sin usos ni descartes previos. Acordar una unidad común: el ejemplo usa **unidades genéricas**, no presupone metros ni kilogramos.

Tener una orden de referencia con planillas, operarios y producción ya cargados para completar la consulta si no alcanza el tiempo para cargar todo en vivo. Preparar también una inyectora, puntera y los materiales que exija la carga elegida. Para faltantes y cierre de lotes, usar lotes demo separados del circuito principal.

**Pendiente antes de cada presentación:** confirmar qué datos existen, qué se creará en vivo y qué se consultará. No se asume que el repositorio entregue automáticamente todo este conjunto de datos. No importar archivos SQL de prueba ni recrear una base real para improvisar la demo.

## 3. Usuario recomendado para demo

La cuenta inicial **`Admin` / `Admin1234`**, de rol **Maestro**, está definida en el proyecto y documentada en la [guía de instalación](guia-instalacion-actualizacion.md). Puede utilizarse para una base de demostración porque permite recorrer también Usuarios.

Respetar las mayúsculas de `Admin` y probar el ingreso antes de presentar. Si la contraseña ya cambió, usar la vigente: reiniciar el backend no la restablece. Son credenciales iniciales/de demostración y **deben cambiarse para uso real**. No mostrar contraseñas reales ni códigos de recuperación en una proyección.

Para comparar roles, tener preparada otra cuenta de prueba. No cambiar los permisos de cuentas reales en vivo.

## 4. Recorrido recomendado

Reservar unos 20–30 minutos, ajustando las cargas al tiempo disponible. Mantener como referencia la misma orden, excepto en los casos de excepción del cuero.

1. **Login:** ingresar con la cuenta demo y explicar que el acceso requiere una sesión.
2. **Dashboard / Inicio:** presentar el resumen, las alertas y el avance general como panorama del trabajo registrado.
3. **Productos:** abrir el producto demo y señalar su modelo, color y consumo de cuero por par, sin alterar códigos base.
4. **Recepción de materiales:** mostrar el remito/lote demo de 10 unidades y su disponibilidad inicial.
5. **Órdenes R013:** elegir ese producto y planificar **20 pares en total**, distribuidos entre los talles (por ejemplo, 10 del talle 40 y 10 del 41); seleccionar un único lote de cuero para que el cálculo sea fácil de seguir.
6. **Cuero suficiente:** comprobar `20 × 0.25 = 5`, guardar la orden demo y volver a la recepción para ver las 5 unidades disponibles.
7. **Cuero insuficiente:** usar otro lote demo, mostrar la confirmación y cancelar primero. Explicar «Guardar igualmente»; ejecutarlo solo si se preparó ese caso de prueba separado.
8. **Recepción de cortes R018/1:** mostrar la orden, remito, controlador, pares recibidos y conformidad. Si se carga una recepción, comprobar antes cuánto queda por recibir.
9. **Planillas R013/1:** consultar la planilla de referencia y comparar esperados, producidos y pendientes por talle. Si se cargará producción en el paso siguiente, evitar registrar aquí los mismos pares.
10. **Producción diaria:** mostrar una jornada por inyectora, operarios y orden. Si se guarda una carga demo, volver a R013/1 para comprobar su actualización.
11. **Uso de materiales:** consultar la relación entre lote, remito, cantidad usada y planilla; localizar el consumo que ya generó la orden, sin volver a cargarlo.
12. **Trazabilidad:** buscar la orden de referencia, abrir el detalle y relacionar talles, planillas, operarios, materiales y remitos registrados.
13. **PDF:** desde el detalle de Trazabilidad, usar **Descargar PDF**, abrir el archivo y contrastarlo con la pantalla.
14. **Estadísticas:** elegir fechas que incluyan la producción demo y mostrar cantidades, distribución por inyectora y estados de inspección.
15. **Usuarios y roles:** cerrar el circuito mostrando quién puede gestionar cuentas y las diferencias entre Maestro, Administrador y Empleado.

Si una etapa aún no tiene datos, decirlo y pasar a la orden de referencia preparada. Una pantalla vacía no demuestra por sí sola una falla del sistema.

## 5. Qué explicar en cada pantalla

Las acciones de carga de esta tabla son opciones para el ensayo; no es necesario ejecutarlas todas en vivo.

| Pantalla | Qué se carga o selecciona | Qué se consulta | Validación o mejora para mostrar | Relación con el circuito |
| --- | --- | --- | --- | --- |
| Login | Usuario y contraseña de prueba. | Resultado del ingreso y acceso al sistema. | Un intento con contraseña incorrecta muestra un mensaje comprensible; luego ingresar correctamente. | Inicia la sesión con la que se realizan las operaciones. |
| Dashboard / Inicio | No se cargan datos de fabricación; se eligen las vistas o accesos disponibles. | Resumen general, alertas del sistema y avance general. | Organización visual y acceso a los datos; si aparece un error de carga, mostrar Reintentar cuando esté disponible. | Resume información generada por las otras pantallas; los valores dependen de la base demo. |
| Productos | Modelo, color fijo y consumo de cuero por par. Para esta demo, consultar el producto ya preparado. | Producto y consumo propuesto para las órdenes. | Buscar, limpiar la búsqueda con la X y mostrar el mensaje sin resultados. | Aporta el producto y el consumo inicial a la planificación. |
| Recepción de materiales | Proveedor, número de remito, fechas, quien recibe, material y cantidades solicitadas/recibidas. | Recepciones y, para cuero, utilizado, descartado, disponibilidad y cierre. | Buscar el remito demo y comparar el saldo antes y después de guardar la orden. | Registra la entrada de material que luego se vincula al uso. |
| Órdenes R013 | Producto, fechas, cantidades por talle, datos de corte/aparado y lote de cuero con consumo por par. | Pares planificados y cálculo del consumo de los lotes elegidos. | Los casos suficiente/insuficiente de la sección 6 y la confirmación con Cancelar o Guardar igualmente. | Vincula la planificación con la R013 de corte/aparado y sus usos de material. |
| Recepción de cortes R018/1 | Fecha, controlador, orden, remito, pares recibidos, estado y observaciones. | Recepciones y tandas de la orden. | No conformidad requiere observación; el total recibido no puede superar el corte de la orden, sumando tandas y filas. Mostrarlo en un formulario de prueba. | Registra el control de los cortes recibidos asociados a la orden. Esta carga usa una cantidad de pares por fila, no un desglose por talle. |
| Planillas R013/1 | Datos de producción vinculados a la orden: fecha, inyectora, puntera, adicionales opcionales, talles, operarios, materiales e inspección según el formulario. | Esperados, realizados y pendientes; operarios y materiales asociados. | Comparación por talle y avance con Enter en la carga de talles. Para el recorrido principal, consultar sin duplicar producción. | Reúne el registro de calzado, puntera/inyección e inspección final de la orden. |
| Producción diaria | Fecha, operarios generales, bloques por inyectora, órdenes, cantidades por talle e inspección. | Producciones registradas y filtros por fecha, estado o inyectora. | Mostrar los pares disponibles por talle; en No conforme se exige una observación y una cantidad entera de pares defectuosos entre 1 y el total producido. | La carga conjunta actualiza la R013/1 de cada orden; comprobar el resultado al volver a Planillas. |
| Uso de materiales | En una carga manual: planilla, material recibido/lote y cantidad utilizada. | Usos vinculados a planillas, con remito, proveedor, material y color. | Búsqueda y selección de relaciones; para el cuero del ejemplo, solo consultar el uso existente. | Permite seguir lo utilizado; los usos manuales también afectan la disponibilidad y no tienen necesariamente las mismas validaciones de Órdenes. |
| Trazabilidad | Búsqueda y selección de una orden/artículo; no cargar datos nuevos en este paso. | Detalle de planillas, pares por talle, operarios y materiales con sus remitos/proveedores. | Abrir una orden preparada y reconocer las relaciones del recorrido. | Reconstruye asociaciones registradas; no equivale a un historial completo e inmutable de cambios. |
| PDF desde Trazabilidad | Seleccionar previamente la orden/artículo y esperar que cargue su detalle. | Documento descargado con la información disponible. | Descargar, abrir y comprobar identificación, datos y legibilidad. | Permite compartir una salida documental de lo registrado; no prometer exportaciones en todas las pantallas. |
| Estadísticas | Período o fechas Desde/Hasta; no se carga producción aquí. | Pares por fecha, inyectora, producto/color e inspección, además de órdenes por fechas de corte y aparado. | Cambiar el período; mostrar el aviso si Desde es posterior a Hasta y corregirlo. | Resume registros del período; distinguir pares producidos de cantidades de órdenes. |
| Usuarios y roles | Usuario, nombre, contraseña y rol permitido al crear una cuenta; editar solo una cuenta demo. | Usuarios y roles visibles para la cuenta conectada. | Formularios de contraseña y acceso a gestión según rol; no borrar ni desactivar cuentas para demostrarlo. | Maestro gestiona cuentas de administradores y empleados; Administrador gestiona empleados y su propia cuenta dentro de sus permisos. Empleado no accede a la gestión de usuarios. |

## 6. Flujo de stock/cuero para mostrar

Basarse en la [guía de stock de cuero](flujo-stock-cuero.md), que describe también las limitaciones actuales.

### Caso principal: cuero suficiente

Usar un lote abierto, sin consumos ni descartes previos, y una sola asignación de cuero en la orden:

| Momento | Recibido | Utilizado | Descartado | Disponible |
| --- | ---: | ---: | ---: | ---: |
| Recepción demo | 10 | 0 | 0 | 10 |
| Después de guardar una orden de 20 pares a 0.25 por par | 10 | 5 | 0 | 5 |

Explicar: **20 pares × 0.25 = 5 unidades utilizadas; 10 − 5 = 5 disponibles**. El recibido sigue siendo 10. El consumo se registra al guardar la orden, sin esperar a la fabricación física; actualmente actúa como consumo/reserva y no separa esos dos conceptos.

No agregar el mismo uso otra vez desde Uso de materiales. Si se asignan varios lotes a la orden, el sistema calcula el consumo para cada lote seleccionado; no reparte automáticamente los pares entre ellos. Por eso el ejemplo usa uno solo.

### Faltante y «Guardar igualmente»

Preparar **otro lote demo** con 5 unidades disponibles. Una orden de 24 pares a `0.25` requiere 6: falta 1 unidad.

1. Mostrar la alerta y la confirmación **Stock de cuero insuficiente** con las cantidades.
2. Pulsar **Cancelar** primero: no se guarda la nueva orden ni se cambia el consumo de ese intento.
3. Explicar **Guardar igualmente**. Solo en el caso demo aislado y ensayado, repetir y confirmar: se registra el consumo completo de 6 y la disponibilidad visible queda en 0.

Esa confirmación no incorpora material ni resuelve el faltante físico. El cero tampoco distingue por sí solo entre un lote agotado y un consumo que excede lo recibido. No presentar la aplicación como un bloqueo absoluto contra faltantes.

### Recibido, utilizado, descartado y disponible

- **Recibido:** cantidad registrada al ingresar el material.
- **Utilizado:** suma de los usos registrados; incluye los generados al guardar la orden.
- **Descartado:** cantidad que se registra como remanente no utilizable al cerrar el lote.
- **Disponible:** para un lote abierto, el máximo entre `recibido − utilizado − descartado` y cero. Un lote cerrado muestra cero.

### Lote cerrado

Consultar un lote cerrado ya preparado o ensayar el cierre en **un tercer lote de prueba**, independiente del caso de faltante. Por ejemplo, con 10 recibidas, 5 utilizadas y 5 disponibles, cerrar registra las 5 restantes como descartadas y deja disponibilidad 0. El lote deja de ofrecerse para asignaciones nuevas en Órdenes; se conservan sus usos anteriores.

Explicar que reabrir quita el cierre, borra el motivo y pone el descarte en cero. No recrea físicamente el material. No reabrir para «arreglar» un saldo durante la presentación. Tampoco afirmar que el cierre bloquea todos los posibles caminos de carga manual.

## 7. Pruebas rápidas durante la presentación

Elegir pocas pruebas y ensayarlas antes:

- [ ] **Login correcto:** entrar con la cuenta demo conocida.
- [ ] **Error amigable:** mostrar un ingreso incorrecto o un período Desde/Hasta inválido, y corregirlo.
- [ ] **Búsqueda y filtros:** buscar un producto, limpiar con la X, mostrar una búsqueda sin coincidencias y filtrar producción por fecha o estado.
- [ ] **Reintentar si falla una carga:** si aparece el botón, verificar primero el servicio y luego usar Reintentar. No apagar servicios compartidos para provocar una falla en vivo; si no ocurre, explicar la opción sin simular una prueba realizada.
- [ ] **Crear/editar algo simple:** cambiar el nombre de una cuenta de prueba desde Usuarios con permisos suficientes, o guardar una recepción demo ya ensayada. Confirmar el mensaje y el resultado; no modificar roles ni códigos base para esta prueba.
- [ ] **Generar PDF:** descargarlo desde la orden seleccionada en Trazabilidad y abrirlo.
- [ ] **Ver trazabilidad:** identificar al menos una relación orden–planilla–material/remito.
- [ ] **Ver estadísticas:** seleccionar un período con producción conocida y contrastar un total.

## 8. Qué NO tocar durante la presentación

- No borrar datos importantes ni usar registros reales para probar eliminaciones.
- No cambiar códigos base de productos, modelos, colores, punteras o adicionales.
- No ejecutar migraciones, importar SQL de instalación ni recrear la base.
- No editar stock/cuero real sin respaldo y revisión previa; para el recorrido usar datos demo.
- No confirmar faltantes con datos reales ni cerrar/reabrir lotes reales como ejemplo.
- No rediseñar permisos en vivo ni desactivar la cuenta con la que se presenta.
- No actualizar el código, cambiar configuración Docker o improvisar instalaciones durante el recorrido.

## 9. Problemas frecuentes durante la demo

| Problema | Cómo continuar |
| --- | --- |
| Backend apagado | Revisar su terminal y MySQL. En modo manual, activar el entorno virtual e iniciar `python app.py` desde `backend/`, según la guía operativa. Esperar un arranque sin errores antes de reintentar. |
| Frontend no conecta | Confirmar backend y URL del frontend, y revisar el error de carga. En desarrollo, `/api` usa el proxy de Vite hacia `127.0.0.1:5000`; en Docker, verificar las conexiones del empaquetado final. No modificar endpoints en vivo. |
| Sesión vencida o perdida | Volver a ingresar con la cuenta demo. Antes de reenviar una carga, comprobar si ya se guardó para no duplicarla; revisar también si hubo reinicio del backend. No atribuirlo a un tiempo fijo de expiración no verificado. |
| Usuario incorrecto | Respetar mayúsculas, contraseña vigente y estado activo. No reiniciar esperando restaurar `Admin1234`; usar la cuenta probada o el flujo documentado de recuperación. |
| Faltan datos demo | Revisar filtros y fechas. Usar la orden de referencia preparada o explicar el formulario sin guardar. Marcar la demostración de resultados como pendiente; no inventar cifras. |
| Advertencia de bundle grande en build | Si `npm run build` finalizó con éxito, la advertencia de tamaño por sí sola no impide la demo. Si terminó con error, resolverlo antes de presentar. No optimizar el código durante la exposición. |
| Backup de 0 bytes | No considerarlo válido. Revisar el error de `mysqldump`, credenciales y permisos según la guía operativa, repetir la copia y verificarla antes de hacer cargas. Si no hay respaldo válido, posponer las operaciones que modifican datos. |

## 10. Cierre de la presentación

Cierre sugerido, adaptándolo a lo que efectivamente se mostró:

> «Seguimos una orden desde el material recibido hasta la producción y su consulta. Vimos la planificación por talle, el consumo de cuero, el control de cortes, las planillas y la producción diaria. Terminamos vinculando esos datos en Trazabilidad, un PDF y estadísticas».

**Estado actual:** hay pantallas y flujos implementados para ese circuito, con validaciones, búsquedas, mensajes de error, reintentos y gestión de usuarios. La carga demo y la comprobación completa en la PC de presentación deben ensayarse previamente. El stock de cuero tiene excepciones explícitas y la trazabilidad disponible no representa una auditoría completa.

Presentar como **mejoras futuras o puntos pendientes de definición/prueba**, sin prometer que ya están resueltos:

- **Docker final:** completar y verificar el empaquetado de entrega, operación, actualización, volúmenes y recuperación según la guía operativa.
- **Auditoría/historial:** ampliar el seguimiento de cambios y movimientos; la autoría y última modificación actuales no son un historial completo.
- **Stock más completo:** definir reservas frente a consumo físico, desperdicios, devoluciones y ajustes, además de la autorización de faltantes y reaperturas.
- **Reportes/exportaciones:** ampliar las salidas existentes según las necesidades acordadas; el PDF mostrado es una función actual, las nuevas exportaciones son propuestas.
- **Permisos más finos:** definir responsabilidades por operación sobre la base de los roles existentes, sin modificarlos durante la demo.
- **Concurrencia:** ampliar pruebas con varios usuarios operando simultáneamente, especialmente sobre cantidades y stock. Una demo con un usuario no acredita todos los casos concurrentes ni implica ausencia de controles actuales.

Antes de cerrar, distinguir lo demostrado, lo que dependió de datos preparados y lo que quedó pendiente. Para una empresa, anotar necesidades y reglas de negocio a validar; para el profesor, explicar cómo las relaciones entre registros sostienen el circuito mostrado.

Documentación de apoyo: [instalación, actualización, backups y recuperación](guia-instalacion-actualizacion.md), [flujo de stock de cuero](flujo-stock-cuero.md) y [README](../README.md).
