from django.core.management.base import BaseCommand

from ...models import User


class Command(BaseCommand):
    """
    Command to create an OpenSlides user.
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
        parser.add_argument(
            'groups_id',
            help='The group id of the new user.'
        )

    def handle(self, *args, **options):
        user_data = {
            'first_name': options['first_name'],
            'last_name': options['last_name'],
        }
        user = User.objects.create_user(options['username'], options['password'], **user_data)
        if options['groups_id'].isdigit():
            user.groups.add(int(options['groups_id']))
