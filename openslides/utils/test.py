from django.core.management import call_command
from django.test import TestCase as _TestCase

from openslides.config.api import config


class TestCase(_TestCase):
    """
    Overwrites Django's TestCase class to refreshs the config cache.
    """

    def _post_teardown(self, *args, **kwargs):
        return_value = super(TestCase, self)._post_teardown(*args, **kwargs)
        # Resets the config object by deleting the cache
        try:
            del config._cache
        except AttributeError:
            # The cache has only to be deleted if it exists.
            pass
        # Clear the whoosh search index
        call_command('clear_index', interactive=False, verbosity=0)
        return return_value
