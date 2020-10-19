import sys

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    Overwrites the django auth's changepassword. It does not respect our cache and our
    own implementation should be used instead.
    """

    def run_from_argv(self, *args, **kwargs):
        self.stderr.write(
            "This command is disabled, use insecurepasswordchange instead."
        )
        sys.exit(1)
