# Manual de usuario — Orden de Fabricación

Guía para quien carga, consulta y controla la fabricación de calzado. La instalación debe estar preparada por la persona responsable siguiendo el [manual de instalación](manual-instalacion-cliente.md). Para aprender, usar una base de demostración con catálogos, materiales y órdenes de prueba; los ejemplos de este manual no crean esos datos.

El recorrido habitual es: **materiales recibidos → producto y orden → cortes recibidos → planilla y producción → consulta de materiales, trazabilidad, estadísticas y PDF**. Las pantallas están relacionadas: cargar una producción o un uso dos veces puede duplicar la información.

## 1. Ingreso al sistema

### Iniciar sesión

1. Abrir la dirección indicada por el instalador. En modo local suele ser `http://127.0.0.1:5173`.
2. Escribir el usuario y contraseña asignados, respetando mayúsculas y minúsculas.
3. Ingresar y comprobar que aparezcan el menú y la pantalla de inicio.

Si aparece un mensaje de credenciales incorrectas, revisar lo escrito y consultar si la cuenta está activa. Las cuentas iniciales/demo están en el [manual de instalación](manual-instalacion-cliente.md); sus contraseñas deben cambiarse para uso real. No se garantiza que sigan vigentes en una base utilizada.

### Recuperar acceso

Para una **cuenta maestra activa** con código preparado:

1. Pulsar **¿Olvidaste la contraseña?** en el login.
2. Ingresar el usuario, su código de recuperación y una contraseña nueva de al menos 8 caracteres.
3. Pulsar **Cambiar contraseña** y esperar la confirmación.
4. Ingresar con la nueva contraseña. El código usado queda invalidado; generar y guardar uno nuevo desde Usuarios.

El código se prepara desde la cuenta maestra en **Usuarios → Generar código** y debe guardarse de forma segura. Generar otro invalida el anterior. Este flujo no envía correos ni recupera la contraseña vieja.

Para empleados y administradores, solicitar el cambio a una persona con permisos sobre la cuenta. Si la cuenta maestra no tiene código, pedir asistencia: la herramienta local sin código mencionada en el login no está incluida en esta rama y su disponibilidad en la entrega queda pendiente de verificación. No borrar usuarios ni recrear la base para recuperar acceso.

### Roles y cierre de sesión

| Rol | Uso general |
| --- | --- |
| Maestro | Opera el sistema, gestiona cuentas de administradores/empleados y consulta actividad. |
| Administrador | Opera el sistema, gestiona empleados y su propia cuenta dentro de sus permisos, y consulta actividad. |
| Empleado | Carga, consulta y edita registros operativos. No accede a Usuarios ni al historial de actividad; eliminar registros se reserva a administración. |

La edición operativa actual también permite trabajar sobre registros ajenos o antiguos: no hay una restricción general de edición solo por autor o por tiempo. Respetar las responsabilidades acordadas por la empresa aunque un botón esté disponible.

Al terminar, guardar o cancelar los formularios pendientes y elegir **Cerrar sesión** en el menú de la cuenta. Si se pierde la sesión durante una carga, volver a ingresar y comprobar primero si el registro se guardó antes de repetirlo.

## 2. Pantalla de inicio / Dashboard

Inicio muestra un **Resumen general**, **Alertas del sistema** y **Avance general**. Las tarjetas resumen productos, proveedores, órdenes y planillas; los paneles permiten detectar órdenes pendientes, planillas en proceso y materiales pendientes de recepción según lo registrado.

Usar las tarjetas, detalles y accesos disponibles para consultar registros y abrir su módulo. Los indicadores se construyen con los datos de la base: una carga incompleta puede producir un resumen incompleto. «Material pendiente» de recibir no es lo mismo que stock disponible para consumir.

Puede usarse el modo claro o noche desde el control de tema. Para una presentación, mantener el zoom del navegador en 100 % y elegir el modo más legible. En listados con buscador se puede limpiar con la X; si hay paginación, revisar también las demás páginas. Un mensaje de «sin resultados» puede deberse al filtro, no a que los registros hayan desaparecido.

## 3. Productos

Un producto relaciona un **modelo de calzado**, su **color fijo** y un **consumo de cuero por par**. Las variantes de producción se completan en las planillas.

Para darlo de alta:

1. Entrar en Productos y abrir el formulario nuevo.
2. Elegir el modelo y el color de los catálogos disponibles.
3. Revisar el consumo por par. El valor propuesto habitualmente es `0.25`, pero debe coincidir con el producto y la unidad de medida acordados.
4. Guardar y comprobar que el producto aparezca en el listado.

Para editar, buscar el producto y usar **Editar**. Confirmar que sea el registro correcto antes de guardar. No cambiar códigos base de productos, modelos, colores, punteras o adicionales sin revisar el impacto con el responsable.

El consumo del producto se propone al elegirlo en una orden y puede ajustarse allí. No asumir que editar un producto recalcula automáticamente todas las órdenes guardadas. Revisar producto, consumo y cantidades antes de cada carga.

## 4. Materiales y proveedores

### Materiales

Materiales es el catálogo de nombres que luego se eligen en recepciones y usos. Crear el nombre necesario o buscar uno existente antes de darlo de alta otra vez. Consultar y editar desde su listado según corresponda.

Crear un material en el catálogo **no agrega unidades al stock**; la cantidad entra mediante Recepción de materiales. Evitar nombres duplicados o ambiguos. En Órdenes, algunos controles dependen de palabras del nombre: renombrar un material ya usado requiere revisión.

### Proveedores

Registrar nombre y los datos de CUIT, teléfono y correo que correspondan al formulario. Buscar por esos datos para consultar o editar la ficha.

Las recepciones identifican al proveedor que entrega el remito. Antes de modificar o eliminar uno ya utilizado, revisar sus relaciones con el responsable. No crear otro proveedor solo porque cuesta encontrarlo: limpiar filtros y verificar primero.

## 5. Recepción de materiales

La recepción registra el ingreso de materiales. Un **remito** identifica la entrega del proveedor y sus líneas generan los **lotes** que se podrán asociar a órdenes o planillas.

1. Abrir una recepción nueva.
2. Completar número de remito, proveedor, fechas, estado y nombre de quien recibe según el formulario.
3. Agregar cada material, color cuando corresponda, cantidad solicitada, cantidad recibida y observaciones.
4. Revisar todas las líneas y guardar.
5. Buscar el remito y desplegar la fila para verificar cada material y sus cantidades.

«Pendiente» en este contexto indica material que todavía falta recibir. No confundirlo con pares pendientes de producir ni con disponibilidad después del consumo.

### Cuero: cantidades y disponibilidad

| Concepto | Cómo interpretarlo |
| --- | --- |
| Recibido | Cantidad ingresada originalmente en la recepción. |
| Utilizado | Usos registrados para el lote, incluidos los generados por órdenes. |
| Descartado | Remanente registrado como no utilizable al cerrar el lote. |
| Disponible | Saldo para un lote abierto: recibido menos utilizado menos descartado, con mínimo cero. Si está cerrado, es cero. |

En el detalle de los materiales cuyo nombre contiene «cuero» se muestran el uso, la disponibilidad y los botones de cierre/reapertura. El descarte forma parte del cálculo; no se presenta aquí como un campo manual independiente del formulario de recepción.

### Cerrar y reabrir un lote de cuero

**Cerrar lote** pide confirmación y retira el remanente disponible como descarte. El lote queda cerrado y deja de ofrecerse para asignaciones nuevas en Órdenes; se conservan los usos previos. Por ejemplo: 10 recibidas, 5 utilizadas y 5 disponibles pasan a tener 5 descartadas y disponibilidad 0.

**Reabrir lote** quita el cierre, borra el motivo y pone el descarte en cero. Solo hacerlo tras comprobar que el remanente existe físicamente y puede usarse. Reabrir no recupera material que se descartó en la realidad.

Al editar una orden que ya usaba un lote cerrado puede conservarse la referencia. No asumir que el cierre bloquea todos los caminos de carga manual. Tampoco modificar cantidades de una recepción utilizada sin revisar cómo cambiarán sus saldos.

El control ampliado de Órdenes alcanza otros materiales, pero estos botones específicos de Recepción siguen asociados al cuero en la versión actual.

## 6. Órdenes R013

La orden establece qué producto fabricar y cuántos pares se esperan por talle. Su R013 relaciona corte/aparado y materiales.

### Crear una orden

1. Entrar en Órdenes y pulsar **+ Nueva orden**.
2. Completar fecha, producto y número de orden.
3. Marcar **Composite** y/o **Forrado** si corresponden; son datos de la orden, no una instrucción para cambiar códigos base.
4. Cargar las cantidades por talle y revisar el **total de pares**. Ejemplo: 10 del talle 40 y 10 del 41 son 20 pares totales, no 20 en cada talle.
5. Completar los responsables de corte/aparado y la fecha de aparado que corresponda. Si se informa fecha de aparado, no debe ser anterior a la de corte.
6. Elegir los materiales desde la lista de **Material recibido**, comprobando material, remito y proveedor. Escribir un nombre sin seleccionarlo no confirma un lote.
7. En los materiales con consumo, revisar **Consumo por par**, **Usará**, **Disponible** y **Quedará**.
8. Guardar, esperar la confirmación y comprobar la orden en el listado. No volver a pulsar para intentar acelerar el guardado.

El selector muestra inicialmente materiales de consumo y permite buscar otros por material, remito o proveedor. La versión actual controla nombres que contienen cuero, cromo, doble frontura, vaqueta, floter o piqué, sin distinguir mayúsculas ni acentos. No todos los materiales disponibles tienen cálculo automático por par.

### Stock suficiente

Con un lote abierto sin consumos ni descartes anteriores:

| Dato demo | Cantidad |
| --- | ---: |
| Recibido | 10 unidades |
| Total de pares | 20 |
| Consumo por par | 0.25 unidades |
| Usará: 20 × 0.25 | 5 unidades |
| Disponible después de guardar | 5 unidades |

Acordar la misma unidad para recepción y consumo; el ejemplo no presupone metros ni kilogramos. El uso se registra al guardar la orden, antes de fabricar físicamente. No volver a cargar esas 5 unidades desde Uso de materiales.

Si hay varios lotes, el cálculo se hace para cada lote sobre el total de pares de la orden y su consumo indicado. El sistema no distribuye automáticamente los pares entre lotes. Revisar cada fila y evitar seleccionar dos veces el mismo lote.

### Stock insuficiente y «Guardar igualmente»

Si hay 5 unidades disponibles y la orden necesita 6, falta 1. Al guardar aparece **Stock de material insuficiente** con el detalle:

- **Cancelar:** no guarda ese intento de creación/actualización; revisar cantidades, consumo o lote. Una orden que se estaba editando conserva su versión ya guardada.
- **Guardar igualmente:** registra el consumo completo aunque falte material. El saldo visible queda en cero; no se registra una recepción nueva ni se resuelve el faltante físico.

Consultar al responsable antes de confirmar una excepción con datos reales. Esto es una recomendación de trabajo, no un circuito de aprobación separado implementado en el sistema. Un saldo cero puede indicar agotamiento o consumo superior a lo recibido.

### Consultar, editar y descargar PDF

Buscar la orden, desplegar su fila y consultar talles, responsables, Composite/Forrado y total. Usar **Editar** y luego **Actualizar** para corregirla.

En edición, el cálculo reconoce el consumo ya asignado a su R013; el resumen puede indicar «Incluye … ya asignadas». Guardar reemplaza los usos de esa R013: revisar especialmente si se agregaron usos manuales en la misma planilla.

El botón **PDF** de Órdenes descarga su documento. Abrirlo y comprobar número, producto, detalles y cantidades antes de compartirlo. Si falla, revisar la conexión y reintentar; no se genera un documento completo si faltan datos necesarios para la consulta.

Más ejemplos: [flujo de stock de cuero](flujo-stock-cuero.md). Esa guía usa el título anterior «Stock de cuero insuficiente»; el aviso actual es general para materiales.

## 7. Recepción de cortes R018/1

Registra las tandas de cortes recibidos y su control de conformidad.

1. Abrir una recepción nueva y completar fecha y nombre del controlador.
2. Agregar líneas con orden, número de remito y cantidad de pares recibidos.
3. Elegir **Conforme** o **No conforme**.
4. Si no es conforme, describir el motivo en observaciones, hasta 500 caracteres.
5. Guardar y verificar las líneas en el listado.

Una orden puede recibirse en varias tandas. El total recibido no puede superar los pares de corte planificados, considerando otras tandas y todas las filas de la recepción. La cantidad se carga por fila, no como un desglose por talle.

Usar la búsqueda por orden, artículo, color, remito o controlador. Antes de corregir una recepción, comprobar cuánto se recibió en las otras tandas para no duplicar cantidades.

## 8. Planillas R013/1

Las planillas reúnen el trabajo de **calzado, puntera, inyección e inspección final** de una orden. Permiten comparar pares esperados, realizados y pendientes por talle.

1. Buscar la planilla existente o abrir **+ Nueva planilla** si corresponde.
2. Seleccionar orden, tipo R013/1 y fecha según el formulario.
3. Cargar o revisar las producciones: fecha, inyectora, tipo de puntera, adicional opcional, operarios de cada etapa y materiales/remitos.
4. Ingresar los pares por talle, revisando lo pendiente. En la grilla se puede avanzar con Enter.
5. Indicar el estado de inspección: **Pendiente**, **Conforme** o **No conforme**. Para una nueva carga o modificación no conforme se exige observación y cantidad entera de defectuosos entre 1 y el total producido.
6. Guardar y consultar el detalle para comprobar la relación con la orden.

Los materiales de puntera y PU se eligen según los campos disponibles; seleccionar su remito establece una relación y no debe interpretarse como un inventario automático completo de todos los materiales.

Producción diaria y Planillas comparten registros de producción. Si los pares ya se cargaron en la jornada, abrir la planilla para verificarlos; no ingresarlos otra vez como una producción nueva.

## 9. Producción diaria

Permite cargar una jornada con varias órdenes y máquinas.

1. Abrir una carga de producción y elegir la fecha real de la jornada.
2. Completar los operarios generales de calzado y puntera, y los de inspección final cuando corresponda.
3. Agregar un bloque por inyectora y sus operarios de inyección.
4. Dentro de cada bloque, elegir las órdenes, tipo de puntera, adicional si corresponde, materiales de puntera/PU y otros materiales necesarios.
5. Ingresar cantidades por talle respetando la disponibilidad que muestra cada campo.
6. Completar la inspección. En **No conforme**, indicar observación y una cantidad entera de pares defectuosos entre 1 y el total producido.
7. Guardar la jornada y revisar el resultado en **Producciones registradas** y en la R013/1 vinculada.

La cantidad defectuosa describe parte de la producción registrada: no se carga como una producción extra. Las producciones antiguas pueden figurar «Sin desglose» si no tienen esa cantidad informada; revisar la carga desde R013/1 cuando corresponda.

Consultar el historial de producción con búsqueda y filtros por fecha, inyectora o inspección, y desplegar una línea para ver sus materiales, operarios y talles. **Abrir planilla completa** permite acceder a la planilla relacionada cuando el registro ofrece ese enlace.

Este historial de producción no es lo mismo que **Ver historial**, que muestra actividad de usuarios en registros habilitados.

## 10. Uso de materiales

Relaciona una **planilla**, un **material recibido/lote** y una **cantidad utilizada**.

1. Buscar primero por planilla, orden, remito, proveedor, material o color para comprobar si el uso ya existe.
2. Si corresponde una carga manual, abrir el formulario y elegir la planilla correcta.
3. Elegir el lote recibido y cargar la cantidad utilizada en la unidad acordada.
4. Guardar y verificar la fila resultante y el saldo del lote.

Los consumos automáticos de Órdenes ya aparecen vinculados a la R013. No volver a ingresarlos. Al editar una orden se reemplazan los usos de esa R013, por lo que los usos manuales asociados requieren revisión.

Una carga manual también puede afectar la disponibilidad, pero no ofrece necesariamente las mismas advertencias y confirmaciones que Órdenes. Revisar el saldo antes de guardar o editar; no utilizarla para sortear un faltante.

## 11. Trazabilidad

Trazabilidad permite seguir la información asociada a una orden/artículo.

1. Entrar en Trazabilidad y buscar por orden, producto, artículo, color, fecha o estado.
2. Seleccionar el registro y abrir su detalle.
3. Consultar planillas, cantidades por talle, producción, operarios y materiales con sus remitos y proveedores.
4. Contrastar esos datos con la orden y las cargas realizadas.
5. Usar **Descargar PDF**, esperar la descarga y abrir el documento antes de compartirlo.

La consulta depende de que las relaciones estén cargadas. Un material sin uso registrado no aparecerá como utilizado solo por existir en el catálogo. El PDF refleja la información disponible para el detalle seleccionado.

Trazabilidad vincula etapas y registros. No equivale a una auditoría completa de cada cambio ni permite recuperar automáticamente datos borrados.

### Historial de actividad

Administradores y maestros pueden ver la actividad reciente y pulsar **Ver historial** en los registros que lo ofrecen. El cuadro muestra acciones, usuario y fecha/hora. Puede cerrarse con la X o Escape.

La versión actual registra eventos y evita duplicados en su consulta; no muestra una comparación de todos los campos anteriores y nuevos. Un registro antiguo puede carecer de eventos anteriores a la incorporación de este seguimiento. Los empleados no tienen acceso a esta consulta de actividad.

## 12. Estadísticas

Elegir **Esta semana**, **Este mes**, **Todo el historial** o un rango **Desde/Hasta**. Desde debe ser anterior o igual a Hasta.

Se muestran pares producidos, órdenes y días con producción, pendientes de inspección y gráficos por fecha, inyectora y producto/color. La inspección distingue conformes, no conformes y pendientes; puede aparecer «Sin desglose» para cargas antiguas sin cantidad defectuosa.

El período de producción utiliza la fecha propia de cada producción, incluida la ingresada desde Planillas. Los cuadros de corte y aparado cuentan órdenes por sus respectivas fechas; no son otro total de pares producidos.

Si faltan resultados, revisar filtros, fechas de carga y existencia de producción. No confundir una orden planificada sin producción con una jornada ya fabricada. El PDF se descarga desde las pantallas que lo ofrecen; no se promete una exportación de estos gráficos a Excel.

## 13. Usuarios

Disponible para Maestro y Administrador, con alcances diferentes.

### Crear y editar cuentas

1. Entrar en Usuarios y pulsar **+ Nuevo usuario**.
2. Completar usuario, nombre, contraseña de al menos 8 caracteres y rol permitido. El usuario debe tener al menos 3 caracteres.
3. Guardar y comprobar la cuenta en la lista.
4. Para corregir sus datos, usar **Editar usuario**.

Maestro puede crear administradores y empleados. Administrador crea y gestiona empleados y puede editar su propia cuenta dentro de sus permisos. No se ofrece crear otra cuenta maestra en este formulario.

En la interfaz actual, **Maestro** puede cambiar el rol y marcar/desmarcar **Cuenta activa** al editar cuentas no maestras. Desactivar impide un nuevo ingreso; no se promete cerrar automáticamente todas las sesiones ya abiertas. No desactivar cuentas durante una presentación ni cambiar roles sin acordar quién necesita el acceso.

### Cambiar contraseña

Elegir **Cambiar contraseña**, indicar la nueva clave y repetirla. Para la propia cuenta también se solicita la contraseña actual. Empleados deben pedir la gestión a quien tenga permisos sobre su cuenta.

La cuenta maestra puede generar el código descrito en la sección 1. Guardarlo fuera del sistema en un lugar protegido; no mostrarlo durante una demo ni enviarlo junto con reportes o respaldos.

La eliminación de cuentas tiene restricciones y confirmación. No usar **Eliminar** como forma de desactivar temporalmente un acceso.

## 14. Consejos de uso

- Acordar con el responsable una frecuencia de backup y una prueba de recuperación. El procedimiento está en el [manual de instalación](manual-instalacion-cliente.md); no asumir que el respaldo es automático.
- No borrar datos importantes ni confirmar una eliminación forzada para «limpiar» un listado. Puede eliminar relaciones y afectar la trazabilidad.
- No cambiar códigos base, nombres de materiales usados o catálogos sin revisar su impacto.
- Practicar altas, modificaciones, cierres y faltantes en datos demo separados de los reales.
- Revisar stock físico, unidad de medida, lote y cantidades antes de **Guardar igualmente**. La confirmación no consigue material faltante.
- Revisar el resultado después de guardar y evitar repetir una operación si hubo un corte de conexión sin comprobar qué ocurrió.
- Elegir un camino para registrar cada producción y cada consumo: no duplicarlos entre Órdenes, Planillas, Producción diaria y Uso de materiales.
- Cerrar sesión al terminar en equipos compartidos y conservar las credenciales de forma protegida.

Para presentar el circuito al profesor o cliente, usar la [guía de presentación](guia-presentacion.md), teniendo en cuenta los nombres y alcances actuales de consumo e historial descritos en este manual.

## 15. Qué hacer ante errores

| Situación | Acción sugerida |
| --- | --- |
| No se cargan datos | Leer el mensaje. Si aparece **Reintentar**, usarlo después de comprobar con el responsable que el servidor y la conexión estén disponibles. |
| La pantalla no conecta | Confirmar la dirección correcta y que frontend, backend y MySQL estén activos. En otra PC, revisar la conexión con el instalador. |
| El formulario marca un campo | Corregir el dato indicado: fecha, selección de lista, cantidad o inspección. No confirmar otra operación para ocultar el error. |
| No aparecen registros | Limpiar búsqueda y filtros, revisar período y paginación. Distinguir «sin resultados» de una falla de carga. |
| Se perdió la sesión | Ingresar nuevamente; antes de repetir el guardado, buscar el registro para evitar duplicados. |
| No hay permisos o no aparece una acción | Consultar al administrador. No compartir una cuenta maestra para eludir la restricción. |
| Falló un PDF | Comprobar que el detalle esté cargado y volver a intentar. Avisar si el archivo no abre o faltan datos. |
| El error se repite | Anotar pantalla, operación, número de orden/remito y hora aproximada; comunicarlo al administrador sin incluir contraseñas ni códigos de recuperación. |

No modificar la base, ejecutar migraciones ni cambiar configuraciones técnicas para resolver una falla de uso sin intervención del responsable. Los procedimientos específicos de una futura entrega Docker están **pendientes de verificar según empaquetado final**.
