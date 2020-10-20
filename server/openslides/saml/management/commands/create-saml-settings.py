import os

from django.core.management.base import BaseCommand

from ...settings import create_saml_settings, get_settings_dir_and_path


class Command(BaseCommand):
    """
    Command to create the saml_settings.json file.
    """

    help = "Create the saml_settings.json settings file."

    def add_arguments(self, parser):
        parser.add_argument(
            "-d",
            "--dir",
            default=None,
            help="Directory for the saml_settings.json file.",
        )

    def handle(self, *args, **options):
        settings_dir = options.get("dir")

        if settings_dir is not None:
            settings_path = os.path.join(settings_dir, "saml_settings.json")
            if not os.path.isdir(settings_dir):
                print(f"The directory '{settings_dir}' does not exist. Aborting...")
                return
        else:
            _, settings_path = get_settings_dir_and_path()
        create_saml_settings(settings_path)
