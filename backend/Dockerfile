FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements-docker.txt ./
RUN pip install --no-cache-dir -r requirements-docker.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python migrate_db.py && exec gunicorn --bind 0.0.0.0:8000 --workers 2 --threads 4 --timeout 60 app:app"]
