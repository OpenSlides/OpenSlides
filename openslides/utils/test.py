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
        from django_redis import get_redis_connection
        config.key_to_id = {}
        get_redis_connection("default").flushall()
