from django.test import TestCase, TransactionTestCase
from pytest_django.plugin import validate_django_db


def pytest_collection_modifyitems(items):
    """
    Helper until https://github.com/pytest-dev/pytest-django/issues/214 is fixed.
    """
    def get_marker_transaction(test):
        marker = test.get_marker('django_db')
        if marker:
            validate_django_db(marker)
            return marker.kwargs['transaction']

        return None

    def has_fixture(test, fixture):
        funcargnames = getattr(test, 'funcargnames', None)
        return funcargnames and fixture in funcargnames

    def weight_test_case(test):
        """
        Key function for ordering test cases like the Django test runner.
        """
        is_test_case_subclass = test.cls and issubclass(test.cls, TestCase)
        is_transaction_test_case_subclass = test.cls and issubclass(test.cls, TransactionTestCase)

        if is_test_case_subclass or get_marker_transaction(test) is False:
            return 0
        elif has_fixture(test, 'db'):
            return 0

        if is_transaction_test_case_subclass or get_marker_transaction(test) is True:
            return 1
        elif has_fixture(test, 'transactional_db'):
            return 1

        return 0

    items.sort(key=weight_test_case)
