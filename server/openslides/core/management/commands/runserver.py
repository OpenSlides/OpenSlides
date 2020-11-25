from django.contrib.staticfiles.management.commands.runserver import (
    Command as RunserverCommand,
)


class Command(RunserverCommand):
    """
    Enables the --debug-email flag
    """

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            "--debug-email",
            action="store_true",
            help="Change the email backend to console output.",
        )

    def handle(self, *args, **options):
        from django.conf import settings

        if options["debug_email"]:
            self.stdout.write("Enabled debug email")
            settings.EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

        return super().handle(*args, **options)
