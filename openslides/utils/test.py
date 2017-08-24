from contextlib import ContextDecorator
from typing import Any
from unittest.mock import patch

from django.core.cache import caches
from django.test import TestCase as _TestCase
from django.test.runner import DiscoverRunner

from ..core.config import config


class OpenSlidesDiscoverRunner(DiscoverRunner):
    def run_tests(self, test_labels, extra_tests=None, **kwargs):  # type: ignore
        """
        Test Runner which does not create a database, if only unittest are run.
        """
        if len(test_labels) == 1 and test_labels[0].startswith('tests.unit'):
            # Do not create a test database, if only unittests are tested
            create_database = False
        else:
            create_database = True

        self.setup_test_environment()
        suite = self.build_suite(test_labels, extra_tests)
        if create_database:
            old_config = self.setup_databases()
        result = self.run_suite(suite)
        if create_database:
            self.teardown_databases(old_config)
        self.teardown_test_environment()
        return self.suite_result(suite, result)


class TestCase(_TestCase):
    """
    Resets the config object after each test.
    """

    def tearDown(self) -> None:
        config.key_to_id = {}


class use_cache(ContextDecorator):
    """
    Contextmanager that changes the code to use the local memory cache.

    Can also be used as decorator for a function.

    The code inside the contextmananger starts with an empty cache.
    """

    def __enter__(self) -> None:
        cache = caches['locmem']
        cache.clear()
        self.patch = patch('openslides.utils.collection.cache', cache)
        self.patch.start()

    def __exit__(self, *exc: Any) -> None:
        self.patch.stop()
