import os

from django.core.management.commands.migrate import Command as _Command


class Command(_Command):
    """
    Creates the folder for the sqlite db before migrations
    """
    def handle(self, *args, **options):
        from django.conf import settings
        # Creates the folder for a SQLite3 database if necessary.
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
            try:
                os.makedirs(settings.OPENSLIDES_USER_DATA_PATH)
            except (FileExistsError, AttributeError):
                # If the folder already exists or the settings
                # OPENSLIDES_USER_DATA_PATH is unknown, just do nothing.
                pass
        super().handle(*args, **options)
