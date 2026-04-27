import psycopg2
from flask import current_app as app

from .cache import LRUCache
from .exceptions import NotFoundError, ServerError


class Database:
    def __init__(self):
        self.config = app.config
        self.logger = app.logger
        self.connection = None

    def get_connection(self):
        if not self.connection:
            self.connection = self.create_connection()
        return self.connection

    def create_connection(self):
        try:
            return psycopg2.connect(
                host=self.config["KEYCLOACK_DATABASE_HOST"],
                port=self.config["KEYCLOACK_DATABASE_PORT"],
                database=self.config["KEYCLOACK_DATABASE_NAME"],
                user=self.config["KEYCLOACK_DATABASE_USER"],
                password=self.config["KEYCLOACK_DATABASE_PASSWORD"],
            )
        except psycopg2.Error as e:
            self.logger.error(f"Error during connect to the database: " f"{repr(e)}")
            raise ServerError(f"Database connect error {e.pgcode}: " f"{e.pgerror}")

    def shutdown(self):
        if self.connection:
            self.connection.close()
