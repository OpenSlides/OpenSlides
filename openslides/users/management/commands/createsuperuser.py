from django.core.management.base import NoArgsCommand

from ...models import User


class Command(NoArgsCommand):
    """
    Command to create or reset the admin user.
    """
    def handle_noargs(self, **options):
        created = User.objects.create_or_reset_admin_user()
        if created:
            self.stdout.write('Admin user successfully created.')
        else:
            self.stdout.write('Admin user successfully reset.')
