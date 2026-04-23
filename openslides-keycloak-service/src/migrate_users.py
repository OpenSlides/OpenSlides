import psycopg2
import logging
import os

from flask import Flask, Response, jsonify, redirect, request

CONFIG_DEFAULTS = {
    "KEYCLOACK_DATABASE_HOST": "postgres",
    "KEYCLOACK_DATABASE_PORT": 5432,
    "KEYCLOACK_DATABASE_NAME": "openslides",
    "KEYCLOACK_DATABASE_USER": "openslides",
    "KEYCLOACK_DATABASE_PASSWORD": "openslides"
}

def get_config(key):
    return os.getenv(key, CONFIG_DEFAULTS[key])

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
        logger.warning(get_config("KEYCLOACK_DATABASE_HOST"))
        try:
            return psycopg2.connect(
                host=get_config("KEYCLOACK_DATABASE_HOST"),
                port=get_config("KEYCLOACK_DATABASE_PORT"),
                database=get_config("KEYCLOACK_DATABASE_NAME"),
                user=get_config("KEYCLOACK_DATABASE_USER"),
                password=get_config("KEYCLOACK_DATABASE_PASSWORD"),
            )
        except psycopg2.Error as e:
            self.logger.error(f"Error during connect to the database: " f"{repr(e)}")

    def shutdown(self):
        if self.connection:
            self.connection.close()

def migrate_to_keycloak():
    database = Database()

    conn = database.get_connection()



app = Flask(__name__)
with app.app_context():
    database = Database()

logger = logging.getLogger(__name__)

migrate_to_keycloak()

