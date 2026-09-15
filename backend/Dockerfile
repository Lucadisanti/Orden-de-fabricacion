FROM python:3.12-slim AS build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends binutils && rm -rf /var/lib/apt/lists/*

COPY requirements-docker.txt ./
RUN pip install --no-cache-dir -r requirements-docker.txt

COPY . .
RUN pip install --no-cache-dir pyinstaller==6.19.0 && \
    pyinstaller --clean --onefile --name orden-backend --paths . \
    --collect-all mysql.connector --collect-all flask --collect-all flask_cors \
    --hidden-import routes.productos_routes --hidden-import routes.colores_routes \
    --hidden-import routes.materiales_routes --hidden-import routes.proveedores_routes \
    --hidden-import routes.maquinas_routes --hidden-import routes.ordenes_routes \
    --hidden-import routes.remitos_routes --hidden-import routes.lotes_routes \
    --hidden-import routes.planillas_routes --hidden-import routes.uso_materiales_routes \
    --hidden-import routes.trazabilidad_routes --hidden-import routes.dashboard_routes \
    --hidden-import routes.catalogos_routes --hidden-import routes.produccion_diaria_routes \
    --hidden-import routes.recepcion_cortes_routes --hidden-import routes.sugerencias_routes \
    server.py

FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/dist/orden-backend ./orden-backend

EXPOSE 8000

CMD ["./orden-backend"]
