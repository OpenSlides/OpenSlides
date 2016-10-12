from django.core.management.base import BaseCommand

from openslides.users.models import User


class Command(BaseCommand):
    """
    Command to change a user's password.
    """
    help = 'Changes user password.'

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            help='The name of the user to set the password for'
        )
        parser.add_argument(
            'password',
            help='The new password of the user'
        )

    def handle(self, *args, **options):
        user = User.objects.get(username=options['username'])
        user.set_password(options['password'])
        user.save()
