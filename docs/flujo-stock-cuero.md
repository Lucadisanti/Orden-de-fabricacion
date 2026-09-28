# Flujo actual de consumo y stock de cuero

Esta guía describe el comportamiento actual de la aplicación. No establece nuevas reglas de negocio ni requiere ejecutar migraciones. Los ejemplos usan unidades genéricas: antes de cargar datos reales, acordá la unidad de medida y utilizá la misma para recepción y consumo.

## 1. Qué representa el consumo de cuero

- **Consumo por par:** cantidad de cuero prevista para fabricar un par. Se configura en Productos y puede ajustarse en la orden. El valor predeterminado es `0.25`.
- **Consumo por orden:** para cada lote de cuero seleccionado, se multiplica el total de pares planificados por el consumo por par indicado para ese lote. Al guardar, el resultado se redondea a dos decimales.
- **Material identificado como cuero:** actualmente el sistema reconoce los materiales cuyo nombre contiene la palabra `cuero`, sin distinguir mayúsculas y minúsculas. Renombrar un material puede afectar esa identificación.
- **Disponibilidad:** cantidad recibida menos los usos registrados y la cantidad descartada. El saldo mostrado nunca es menor que cero. Si el lote está cerrado, su disponibilidad es cero.

```text
Consumo del lote en la orden = pares planificados × consumo por par
Disponibilidad del lote abierto = máximo(recibido − utilizado − descartado, 0)
```

El descuento se registra al guardar la orden, sin esperar a la producción física. La cantidad recibida permanece como dato de la recepción; la disponibilidad se obtiene descontando los usos.

## 2. Pantallas involucradas

| Pantalla | Participación en el flujo |
| --- | --- |
| Productos | Define el consumo de cuero por par que se propone al seleccionar el producto en una orden. |
| Recepción de materiales | Registra el cuero recibido por lote y remito. Permite consultar lo utilizado y disponible, y cerrar o reabrir lotes. |
| Órdenes R013 | Permite elegir lotes, indicar consumo por par, revisar el consumo calculado y guardar la orden con sus usos de materiales. |
| Uso de materiales | Permite consultar, registrar, editar y eliminar usos vinculados a planillas. Sus cantidades también afectan la disponibilidad. |
| Planillas | Vincula materiales y producción con las órdenes. El consumo calculado desde Órdenes se registra en la R013 de corte y aparado. |
| Trazabilidad | Permite consultar las relaciones entre órdenes, planillas y materiales. No equivale a un historial completo de movimientos de stock. |

## 3. Flujo normal

1. **Crear o editar el producto.** Revisá su consumo de cuero por par y guardalo.
2. **Recibir el cuero.** En Recepción de materiales, cargá proveedor, remito, material y cantidad recibida.
3. **Crear la orden R013.** Elegí el producto y cargá las cantidades por talle. Su suma determina los pares planificados.
4. **Asignar el lote de cuero.** En Material utilizado, elegí la recepción correspondiente y verificá el consumo por par propuesto.
5. **Revisar el cálculo.** La pantalla muestra cuánto usará la orden, cuánto hay disponible y cuánto quedará. Si seleccionás varios lotes, revisá el cálculo de cada uno; el sistema no reparte automáticamente los pares entre ellos.
6. **Guardar la orden.** El sistema vuelve a comprobar la disponibilidad y registra los usos asociados a su R013. Esos usos reducen el saldo disponible para otras órdenes.
7. **Comprobar el resultado.** Consultá la recepción y los usos de materiales para verificar las cantidades registradas.

Al editar una orden, el cálculo del servidor excluye los usos anteriores de su propia R013 y los reemplaza por los nuevos. Revisá el resultado para comprobar que no se duplique el consumo ni se pierdan usos cargados manualmente en esa planilla.

## 4. Caso de cuero suficiente

Ejemplo con un lote abierto, sin otros usos ni descartes:

| Dato | Cantidad |
| --- | ---: |
| Cuero recibido | 10 unidades |
| Pares de la orden | 20 pares |
| Consumo por par | 0.25 unidades |
| Consumo de la orden: 20 × 0.25 | 5 unidades |
| Disponibilidad después de guardar: 10 − 5 | 5 unidades |

La recepción sigue indicando 10 unidades recibidas. Los usos registrados suman 5 y quedan 5 disponibles.

## 5. Caso de cuero insuficiente

Cuando el consumo supera el saldo, la pantalla muestra una alerta. Al intentar guardar, aparece la confirmación **“Stock de cuero insuficiente”**, con las cantidades disponibles, requeridas y faltantes.

- **Cancelar:** no se guarda esa creación o actualización. Podés revisar cantidades, consumo o lote. Si estabas editando, se conserva lo que ya estaba guardado.
- **Guardar igualmente:** registra el consumo completo aunque el cuero disponible no alcance. La disponibilidad del lote afectado se muestra en cero; no se limita el consumo a lo recibido.

Por ejemplo, con 5 unidades disponibles y una orden que requiere 6, confirmar registra las 6 unidades y deja la disponibilidad mostrada en cero. Esa confirmación no representa una recepción adicional de cuero ni resuelve el faltante físico.

El sistema permite esta excepción: no debe interpretarse como una garantía de que todas las órdenes guardadas cuentan con material suficiente.

## 6. Lotes cerrados

Desde Recepción de materiales se puede **cerrar un lote de cuero** cuando su remanente no sea utilizable. El sistema registra ese remanente como descartado, marca el lote cerrado y muestra disponibilidad cero. En el selector de Órdenes deja de ofrecerse para asignaciones nuevas.

Cerrar el lote no elimina los usos ya registrados. Al editar una orden que lo tenía asignado, el lote puede seguir apareciendo para conservar esa referencia. El cierre tampoco debe interpretarse como un bloqueo de todos los caminos de carga manual.

**Reabrir debe hacerse con cuidado:** la operación quita el cierre, borra el motivo y pone la cantidad descartada en cero. La disponibilidad vuelve a depender de lo recibido menos lo utilizado. Antes de reabrir, comprobá que el remanente exista físicamente y pueda usarse; reabrir no recupera cuero que realmente fue descartado.

## 7. Cosas que conviene probar

Usá datos de demostración y anotá los saldos antes y después de cada prueba.

- [ ] **Orden con cuero suficiente:** reproducir el ejemplo de 10 unidades, 20 pares y consumo `0.25`; verificar 5 utilizadas y 5 disponibles.
- [ ] **Cuero insuficiente y cancelar:** comprobar que no se creó la orden ni se alteraron los usos de una orden editada.
- [ ] **Cuero insuficiente y guardar igualmente:** verificar que se registra el consumo completo y se muestra saldo cero.
- [ ] **Editar sin duplicar consumo:** guardar sin cambios, luego aumentar y reducir pares; contrastar los usos y la disponibilidad.
- [ ] **Editar una recepción ya usada:** modificar la cantidad recibida en datos de prueba y revisar el efecto sobre órdenes, usos y saldo. No asumir que el sistema impide reducirla por debajo de lo utilizado.
- [ ] **Usar material manualmente:** registrar y editar un uso; comprobar cómo cambia el saldo y qué ocurre al editar después la R013 relacionada. No registrar otra vez el consumo que ya generó la orden.
- [ ] **Cerrar y reabrir un lote:** comprobar saldo cero, exclusión de las opciones para órdenes nuevas y disponibilidad al reabrir; revisar también una orden que ya lo tenía asignado.

## 8. Limitaciones conocidas

- El descuento actual funciona como **consumo/reserva al crear o actualizar la orden**. No hay una separación entre consumo previsto y consumo físico real.
- No hay todavía un historial completo de movimientos, ajustes, descartes y reaperturas. La autoría y la última modificación no reemplazan ese historial.
- El saldo se muestra como mínimo en cero. Por sí solo, ese cero no distingue un lote agotado de uno cuyo consumo registrado supera lo recibido.
- Los usos manuales no pasan por la misma confirmación de stock que Órdenes. No se debe asumir que ofrecen las mismas validaciones.
- Editar una orden reemplaza los usos de su R013; los registros manuales en esa misma planilla requieren especial revisión.
- La identificación del cuero depende del nombre del material y la unidad de medida debe acordarse antes de operar.
- Las reglas finas de negocio todavía deben definirse: quién autoriza faltantes y reaperturas, cómo distinguir reserva de consumo real, y cómo registrar desperdicios, devoluciones y ajustes.

## 9. Recomendaciones de uso

- Probá primero con datos de demostración, especialmente las confirmaciones de faltantes, ediciones de recepciones utilizadas y reaperturas.
- Revisá producto, lote, pares, consumo por par y unidad de medida antes de guardar. Volvé a comprobarlos después de crear un producto o una recepción desde la orden.
- Evitá seleccionar el mismo lote en varias filas o duplicar manualmente un uso que ya generó la R013.
- Consultá con la persona responsable antes de confirmar un faltante o reabrir un lote. Esta es una recomendación operativa; no implica que exista un circuito de aprobación implementado.
- Hacé una copia de seguridad antes de cambios grandes o actualizaciones que puedan afectar datos.
- No cambies productos, códigos, nombres de materiales usados o estructura de base de datos sin revisar el impacto sobre órdenes, stock y trazabilidad.
