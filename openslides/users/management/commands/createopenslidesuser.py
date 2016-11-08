from django.core.management.base import BaseCommand

from openslides.users.models import UserManager


class Command(BaseCommand):
    """
    Command to create a new OpenSlides user
    """
    help = 'Creates an OpenSlides user.'

    def add_arguments(self, parser):
        parser.add_argument(
            'first_name',
            help='The first name of the new user.'
        )
        parser.add_argument(
            'last_name',
            help='The last name of the new user.'
        )
        parser.add_argument(
            'username',
            help='The username of the new user.'
        )
        parser.add_argument(
            'password',
            help='The password of the new user.'
        )

    def handle(self, *args, **options):
        user_data = {
            'first_name': options['first_name'],
            'last_name': options['last_name'],
        }
        UserManager.create_user(options['username'], options['password'], **user_data)
