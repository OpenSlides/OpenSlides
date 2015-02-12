import os

from django.core.management.commands.migrate import Command as _Command

from ...signals import post_permission_creation


class Command(_Command):
    """
    Migration command that does nearly the same as Django's migration command
    but also calls the post_permission_creation signal.
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

        # Send this signal after sending post_migrate (inside super()) so that
        # all Permission objects are created previously.
        post_permission_creation.send(self)
