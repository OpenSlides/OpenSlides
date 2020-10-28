from django.core.management.base import BaseCommand

from openslides.users.models import User


class Command(BaseCommand):
    """
    Command to change a user's password.
    """

    help = "Changes the admin password, if he exists (username='admin') and the password is the default one ('admin')."

    def add_arguments(self, parser):
        parser.add_argument("password", help="The new password of the admin")

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username="admin")
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR("There is no user with the username 'admin'.")
            )
            return

        if user.check_password("admin"):
            user.set_password(options["password"])
            user.save()
            self.stdout.write(
                self.style.SUCCESS("Password of user admin successfully changed.")
            )
        else:
            self.stdout.write(
                self.style.NOTICE("The admin has not the default password. Done.")
            )
