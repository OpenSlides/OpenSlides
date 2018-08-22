from django.test import TestCase as _TestCase

from ..core.config import config


class TestCase(_TestCase):
    """
    Resets the config object after each test.
    """

    def tearDown(self) -> None:
        config.save_default_values()
