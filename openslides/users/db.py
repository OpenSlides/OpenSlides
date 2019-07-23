from django.db import connection


def postgres_restart_auth_group_id_sequence(*args, **kwargs):
    """
    This function resets the id sequence from the auth_group table (the current auto
    increment value for the id field) to the max_id+1. This is needed, when inserting
    groups by id, because Postgresql does not update the id sequence.
    """
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute("SELECT max(id) + 1 as max FROM auth_group;")
            max_id = cursor.fetchone()[0]
            if max_id is not None:
                cursor.execute(
                    f"ALTER SEQUENCE auth_group_id_seq RESTART WITH {max_id};"
                )
