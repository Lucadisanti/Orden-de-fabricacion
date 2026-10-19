# Recuperar el acceso administrador

En las versiones que muestran **¿Olvidaste la contraseña?** en la pantalla de ingreso, solo la cuenta maestra puede usar el código de recuperación. Escribí el usuario maestro, el código y una contraseña nueva de al menos ocho caracteres. El código funciona una sola vez.

Si perdiste también el código, usá la computadora donde está instalado el sistema:

1. Abrí Docker Desktop e iniciá el sistema con **Abrir sistema.cmd**.
2. Hacé doble clic en **Recuperar acceso administrador.cmd**.
3. Escribí el usuario maestro. Si se llama `Admin`, presioná Enter.
4. El programa mostrará una contraseña temporal. Copiala y entrá al sistema.
5. En **Usuarios**, cambiá esa contraseña y generá un código de recuperación nuevo. Guardá el código en un lugar seguro, fuera de la computadora del sistema.

Esta herramienta solo funciona en la computadora que tiene Docker y la base de datos del sistema. No crea usuarios nuevos: cambia la contraseña de la cuenta maestra activa. El código de recuperación anterior queda invalidado.

El paquete de imágenes `0.2.0` incluye la recuperación desde la pantalla de ingreso y la herramienta local de esta carpeta.
