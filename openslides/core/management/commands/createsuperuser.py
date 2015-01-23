from django.core.management.base import NoArgsCommand

from openslides.users.api import create_or_reset_admin_user


class Command(NoArgsCommand):
    """
    Commands to create or reset the adminuser
    """

    def handle_noargs(self, **options):
        if create_or_reset_admin_user():
            self.stdout.write('Admin user successfully created.')
        else:
            self.stdout.write('Admin user successfully reset.')
