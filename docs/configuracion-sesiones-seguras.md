# Configurar sesiones seguras

## Antes de actualizar una instalación

La versión nueva deja de aceptar una clave incorporada en el código. No cambia usuarios, contraseñas ni datos existentes, pero las sesiones antiguas deben volver a iniciar sesión. Antes de actualizar, comprobar que se dispone de acceso legítimo y del procedimiento de recuperación ya existente.

En producción, guardar una clave generada con un generador criptográfico (al menos 32 bytes aleatorios) en `FLASK_SECRET_KEY`, dentro del archivo privado de configuración o del gestor de secretos. No usar una frase de ejemplo, un nombre de proyecto o una contraseña de usuario. No imprimir el valor, pegarlo en logs ni subirlo a Git. Conservar la misma clave entre reinicios y réplicas; rotarla deliberadamente invalida sesiones.

- Repositorio con Docker: agregar la variable al `.env.docker` existente.
- Paquete del cliente: agregarla al `.env.cliente` existente.
- Backend manual: configurarla en su entorno privado o en `backend/.env`.

Los archivos de ejemplo tienen el campo vacío a propósito: no contienen una clave utilizable. Los dos Compose exigen la variable antes de iniciar servicios. El backend también la valida, incluso si se ejecuta fuera de Docker. Una configuración ausente o trivial produce un error que no incluye el valor recibido. No reemplazar los archivos privados por ejemplos ni cambiar sus otras variables.

Esta actualización de código no modifica ningún archivo privado ni inicia la aplicación. La preparación de esa clave debe realizarse antes del despliegue. Si no está preparada, conservar la instalación actual sin iniciar una actualización incompleta; no restaurar el antiguo fallback como solución.

## Desarrollo explícito

Configurar `ORDEN_ENV=development`. Si no se proporciona `FLASK_SECRET_KEY`, el proceso genera una clave temporal criptográficamente aleatoria. Reiniciar el proceso requiere volver a iniciar sesión; este modo no sirve para producción ni para múltiples procesos que compartan sesiones. Para sesiones persistentes en desarrollo también puede configurarse una clave privada válida.

Ejemplo de arranque local en Linux/macOS, desde backend:

```bash
ORDEN_ENV=development python app.py
```

En Windows CMD, establecer `set ORDEN_ENV=development` antes del arranque. Estos comandos son instrucciones para el operador; no forman parte de las pruebas y pueden inicializar la base si se ejecutan.

## Pruebas

La suite declara `ORDEN_ENV=testing`, `TESTING=1` y una clave aleatoria por proceso antes de importar Flask. No usa secretos reales. Mantiene el bloqueo de conexiones MySQL y los mocks de persistencia. El modo `testing` requiere el indicador explícito `TESTING=1`.

La configuración rechaza producción sin clave, claves cortas/triviales y entornos desconocidos. Las regresiones prueban que una cookie firmada con una clave ajena es rechazada y que una clave privada estable se conserva entre instancias.

## Revalidación y compatibilidad

Cada petición protegida, incluido `/api/auth/me`, consulta la cuenta por su identificador antes de autorizar. El rol y nombre vigentes reemplazan la copia de la cookie. Una cuenta eliminada o inactiva pierde acceso; una reducción de rol se aplica en la siguiente petición.

Al iniciar sesión se guarda una huella HMAC del hash de contraseña. La cookie no contiene el hash de contraseña. Cambiar o recuperar la contraseña invalida las sesiones emitidas con el hash anterior, incluso en otros dispositivos y mediante la recuperación local existente. No se agregan tablas, columnas ni migraciones.

Las cookies anteriores a esta versión requieren un nuevo login. Los usuarios y contraseñas existentes siguen siendo válidos si la cuenta está activa; si una pantalla ya estaba abierta, recargarla o usar Salir para volver a iniciar sesión. Si MySQL falla, se deniega la operación con 503 sin borrar la cookie; se puede reintentar cuando se recupere el servicio.

La revalidación añade una lectura de cuenta por petición protegida. No elimina una operación que ya estaba en curso cuando cambió el estado de la cuenta. Logout borra la cookie de ese navegador; una revocación individual centralizada y un límite de inactividad siguen siendo mejoras independientes pendientes.
