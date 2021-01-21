from django.db import connection


def is_postgres() -> bool:
    return connection.vendor == "postgresql"


def restart_id_sequence(table_name: str) -> None:
    """
    This function resets the id sequence from the given table (the current auto
    increment value for the id field) to the max_id+1. This is needed, when manually
    inserting object id, because Postgresql does not update the id sequence in this case.
    """
    if not is_postgres():
        return

    with connection.cursor() as cursor:
        cursor.execute(f"SELECT max(id) + 1 as max FROM {table_name};")
        max_id = cursor.fetchone()[0]
        if max_id is not None:
            cursor.execute(f"ALTER SEQUENCE {table_name}_id_seq RESTART WITH {max_id};")
