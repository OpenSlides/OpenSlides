from django.core.management.base import BaseCommand, CommandError

from openslides.core.config import config
from openslides.core.exceptions import ConfigError, ConfigNotFound


class Command(BaseCommand):
    """
    Command to change OpenSlides config values.
    """

    help = "Changes OpenSlides config values."

    def add_arguments(self, parser):
        parser.add_argument(
            "key", help="Config key. See config_variables.py in every app."
        )
        parser.add_argument(
            "value", help='New config value. For a falsy boolean use "False".'
        )

    def handle(self, *args, **options):
        if options["value"].lower() == "false":
            options["value"] = False
        try:
            config[options["key"]] = options["value"]
        except (ConfigError, ConfigNotFound) as e:
            raise CommandError(str(e))
        self.stdout.write(
            self.style.SUCCESS(
                f"Config {options['key']} successfully changed to {config[options['key']]}."
            )
        )
