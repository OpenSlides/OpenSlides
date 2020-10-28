from django.core.management.base import BaseCommand

from ...models import User


class Command(BaseCommand):
    """
    Command to create or reset the admin user.
    """

    help = "Creates or resets the admin user."

    def handle(self, *args, **options):
        created = User.objects.create_or_reset_admin_user()
        if created:
            self.stdout.write(self.style.SUCCESS("Admin user successfully created."))
        else:
            self.stdout.write(self.style.SUCCESS("Admin user successfully reset."))
