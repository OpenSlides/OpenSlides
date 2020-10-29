from django.core.management.base import BaseCommand

from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.postgres import restart_id_sequence

from ...models import User


class Command(BaseCommand):
    """
    Command to create an OpenSlides user.
    """

    help = "Creates an OpenSlides user."

    def add_arguments(self, parser):
        user_id_help = (
            "The id of the user. If given, the user will only be created with this id, if"
            + " there is no user with this id. The user will not be updated, if the user already exist."
        )
        parser.add_argument("first_name", help="The first name of the new user.")
        parser.add_argument("last_name", help="The last name of the new user.")
        parser.add_argument("username", help="The username of the new user.")
        parser.add_argument("password", help="The password of the new user.")
        parser.add_argument("groups_id", help="The group id of the new user.")
        parser.add_argument("--email", help="The email address of the new user.")
        parser.add_argument("--userid", help=user_id_help)

    def handle(self, *args, **options):
        userid = None
        try:
            userid = int(options["userid"])
        except (ValueError, TypeError):
            pass

        user_data = {
            "first_name": options["first_name"],
            "last_name": options["last_name"],
            "default_password": options["password"],
            "email": options["email"] or "",
        }
        username = options["username"]
        if (
            userid is None or not User.objects.filter(pk=userid).exists()
        ) and not User.objects.filter(username=username).exists():
            if userid is not None:
                user_data["pk"] = userid

            user = User.objects.create_user(
                username,
                options["password"],
                **user_data,
            )
            if options["groups_id"].isdigit():
                user.groups.add(int(options["groups_id"]))
                inform_changed_data(user)

            if userid is not None:
                restart_id_sequence("users_user")

            self.stdout.write(self.style.SUCCESS(f"Created user {username}."))
        else:
            self.stdout.write(
                self.style.NOTICE(
                    f"A user with id {userid} or username {username} already exists."
                )
            )
