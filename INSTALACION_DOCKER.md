# Instalacion con Docker

Esta version ejecuta frontend, backend y MariaDB con Docker Compose. Los datos se guardan en el volumen `orden_fabricacion_datos` y no se eliminan al detener o reconstruir los contenedores.

## Requisitos de la computadora

- Windows 10 u 11 de 64 bits compatible con Docker Desktop.
- Virtualizacion habilitada.
- WSL 2 y Docker Desktop instalados.
- Al menos 8 GB de memoria RAM.

No es necesario instalar Python, Node.js, XAMPP ni MySQL.

## Primera instalacion

1. Copiar la carpeta completa del proyecto a una ubicacion estable, por ejemplo `C:\OrdenFabricacion`.
2. Abrir PowerShell dentro de esa carpeta.
3. Crear la configuracion local:

   ```powershell
   Copy-Item .env.docker.example .env.docker
   ```

4. Abrir `.env.docker` y reemplazar ambas contrasenas de ejemplo. No usar espacios ni los caracteres `#`, comillas o `$`.
5. Iniciar Docker Desktop y esperar a que indique que el motor esta activo.
6. Ejecutar:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\iniciar.ps1
   ```

7. Abrir `http://localhost:8080`.

La base y los procedimientos se crean automaticamente solo la primera vez que el volumen esta vacio.

## Uso desde otras computadoras

Las computadoras deben estar en la misma red. En la PC principal ejecutar `ipconfig`, buscar la direccion IPv4 y abrir desde el otro equipo:

```text
http://IP-DE-LA-PC:8080
```

Puede ser necesario permitir el puerto 8080 en el Firewall de Windows. La PC principal y Docker Desktop deben permanecer encendidos.

## Detener e iniciar

Para detener sin borrar los datos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\detener.ps1
```

Para volver a iniciar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar.ps1
```

Nunca usar `docker compose down -v`, porque `-v` elimina el volumen de la base de datos.

## Crear un backup

Con el sistema iniciado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

El archivo se guarda dentro de `backups`. Esta carpeta debe copiarse periódicamente a otro disco o almacenamiento.

## Actualizar

1. Cerrar la aplicacion en los navegadores.
2. Copiar los archivos de la nueva version sobre la carpeta existente, conservando `.env.docker` y `backups`.
3. Si la version incluye una migracion SQL, aplicarla de acuerdo con las notas de esa version antes de continuar.
4. Ejecutar:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\actualizar.ps1
   ```

El script crea primero un backup y luego reconstruye frontend y backend. El volumen de MariaDB permanece intacto.

## Comprobaciones utiles

Ver el estado:

```powershell
docker compose --env-file .env.docker ps
```

Ver los registros:

```powershell
docker compose --env-file .env.docker logs --tail 100
```

Reiniciar:

```powershell
docker compose --env-file .env.docker restart
```
