# Sistema de órdenes de fabricación

Aplicación para administrar órdenes de fabricación de calzado, planificación por talle, planillas de producción, recepción y uso de materiales y trazabilidad.

## Tecnologías

- Frontend: React + Vite
- Backend: Python 3.12 + Flask
- Base de datos: MySQL/MariaDB mediante XAMPP

## Funcionalidades principales

- Órdenes con cantidades esperadas por talle.
- Planilla R013 para Corte y Aparado.
- Planilla R013/1 para Calzado, Puntera e Inyección.
- Selección de inyectora SULPOL o BGM.
- Carga de producción por talle con teclado y avance mediante Enter.
- Comparación de pares esperados, realizados y pendientes.
- Operarios por etapa y materiales utilizados.
- Trazabilidad completa por orden.
- Interfaz responsive para computadora, tablet y celular.

## Requisitos

- XAMPP con MySQL iniciado.
- Python 3.12.
- Node.js y npm.
- Git.

## Instalación desde cero

### 1. Descargar el proyecto

```bash
git clone https://github.com/Lucadisanti/Orden-de-fabricacion.git
cd Orden-de-fabricacion
```

### 2. Crear la base de datos

Abrir `http://localhost/phpmyadmin`, ingresar en **Importar** y ejecutar, en este orden:

1. `docs/modelo_base_datos/bd_orden_fabricacion.sql`
2. `docs/modelo_base_datos/stored_procedures.sql`

El primer archivo recrea la base completa. No debe ejecutarse sobre una base con información que se quiera conservar sin realizar antes una copia de seguridad.

### 3. Configurar y levantar el backend

Desde la carpeta raíz del proyecto:

```bash
cd backend
py -3.12 -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
python app.py
```

La API queda disponible en `http://127.0.0.1:5000`.

La configuración predeterminada de XAMPP es:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=orden_fabricacion
DB_PORT=3306
```

### 4. Levantar el frontend

En otra terminal, desde la carpeta raíz:

```bash
cd frontend
npm install
npm run dev
```

Abrir la dirección indicada por Vite, normalmente `http://127.0.0.1:5173` o `http://127.0.0.1:4173`.

## Actualizar una instalación existente

Antes de actualizar, realizar una copia de seguridad de la base desde phpMyAdmin.

Desde la carpeta del proyecto:

```bash
git pull origin main
```

Luego actualizar las dependencias:

```bash
cd backend
venv\Scripts\activate
python -m pip install -r requirements.txt
cd ..\frontend
npm install
```

Para incorporar la planificación por talle sin borrar la información existente, importar desde phpMyAdmin:

```text
docs/modelo_base_datos/migracion_talles_por_orden_2026-08-19.sql
```

Esta migración crea `detalle_orden`, conserva las órdenes existentes y actualiza los procedimientos necesarios. Debe ejecutarse una sola vez en cada base anterior a esta versión.

Después, reiniciar backend y frontend.

## Trabajo diario

Backend:

```bash
cd backend
venv\Scripts\activate
python app.py
```

Frontend, en otra terminal:

```bash
cd frontend
npm run dev
```

## Subir cambios a GitHub

Revisar los archivos modificados:

```bash
git status
git diff --check
```

Guardar y subir una versión:

```bash
git add .
git commit -m "Mejora planillas, trazabilidad y diseño responsive"
git push origin main
```

No subir el archivo `backend/.env`, contraseñas, copias de seguridad ni las carpetas `node_modules` o `venv`.
