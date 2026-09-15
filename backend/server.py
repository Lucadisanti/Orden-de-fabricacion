from waitress import serve

from app import app
from db.migrations import migrate_schema


if __name__ == "__main__":
    migrate_schema()
    serve(app, host="0.0.0.0", port=8000, threads=8)
