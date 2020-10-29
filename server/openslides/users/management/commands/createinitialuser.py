from django.core.management.base import BaseCommand
from django.db import connection

from .createopenslidesuser import Command as CreateOpenslidesUser


class Command(BaseCommand):
    """
    Command to create an OpenSlides user.
    """

    help = "Creates an OpenSlides user with id=2 if no other user than the administrator were created before."

    def add_arguments(self, parser):
        parser.add_argument("first_name", help="The first name of the new user.")
        parser.add_argument("last_name", help="The last name of the new user.")
        parser.add_argument("username", help="The username of the new user.")
        parser.add_argument("password", help="The password of the new user.")
        parser.add_argument("groups_id", help="The group id of the new user.")
        parser.add_argument("--email", help="The email address of the new user.")

    def handle(self, *args, **options):
        options["userid"] = 2

        with connection.cursor() as cursor:
            cursor.execute("SELECT last_value FROM users_user_id_seq;")
            last_id = cursor.fetchone()[0]
            if last_id > 1:
                self.stdout.write(
                    self.style.NOTICE(
                        "There have users been created before. Do nothing."
                    )
                )
                return

        CreateOpenslidesUser().handle(**options)
