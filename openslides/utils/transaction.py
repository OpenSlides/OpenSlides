from django.conf import settings
from django.db import DEFAULT_DB_ALIAS
from django.db.transaction import Atomic, get_connection


class LockedAtomicTransaction(Atomic):
    """
    Does a atomic transaction, but also locks the entire table for any
    transactions, for the duration of this transaction. Although this is
    the only way to avoid concurrency issues in certain situations, it
    should be used with caution, since it has impacts on performance, for
    obvious reasons.

    Using:  with LockedAtomicTransaction(MyModel):
                do_stuff_with_MyModel()

    This class was originally written by jdepoix
    (http://stackoverflow.com/a/41831049) and has been slightly modified
    here.
    """
    def __init__(self, model, using=None, savepoint=None):
        self.model = model
        return super().__init__(using, savepoint)

    def __enter__(self):
        super().__enter__()

        # Make sure not to lock, when SQLite3 is used, or you'll run into problems while running tests.
        if settings.DATABASES[self.using or DEFAULT_DB_ALIAS]['ENGINE'] != 'django.db.backends.sqlite3':
            cursor = None
            try:
                cursor = get_connection(self.using).cursor()
                cursor.execute(
                    'LOCK TABLE {db_table_name}'.format(db_table_name=self.model._meta.db_table)
                )
            finally:
                if cursor and not cursor.closed:
                    cursor.close()
