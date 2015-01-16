import os

from django.core.management.commands.migrate import Command as _Command

from openslides.users.api import create_builtin_groups_and_admin


class Command(_Command):
    """
    Migration command that does the same like the django migration command but
    calles also creates the default groups
    """
    # TODO: Try to get rid of this code. The problem are the ContentType
    # and Permission objects, which are created in the post_migrate signal, but
    # we need to things later.

    def handle(self, *args, **options):
        from django.conf import settings
        # Creates the folder for a sqlite database if necessary
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
            try:
                os.makedirs(settings.OPENSLIDES_USER_DATA_PATH)
            except (FileExistsError, AttributeError):
                # If the folder already exist or the settings OPENSLIDES_USER_DATA_PATH
                # is unknown, then do nothing
                pass

        super().handle(*args, **options)
        create_builtin_groups_and_admin()
