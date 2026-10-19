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
