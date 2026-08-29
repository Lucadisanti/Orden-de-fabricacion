import logging

from db.migrations import migrate_schema


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    migrate_schema()
