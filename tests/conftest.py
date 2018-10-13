import pytest
from django.test import TestCase, TransactionTestCase
from pytest_django.django_compat import is_django_unittest
from pytest_django.plugin import validate_django_db

from openslides.utils.cache import element_cache


def pytest_collection_modifyitems(items):
    """
    Helper until https://github.com/pytest-dev/pytest-django/issues/214 is fixed.
    """
    def get_marker_transaction(test):
        marker = test.get_closest_marker('django_db')
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


@pytest.fixture(autouse=True)
def constants(request):
    """
    Resets the constants on every test.

    Uses fake constants, if the db is not in use.
    """
    from openslides.utils.constants import set_constants, get_constants_from_apps

    if 'django_db' in request.node.keywords or is_django_unittest(request):
        # When the db is created, use the original constants
        set_constants(get_constants_from_apps())
    else:
        # Else: Use fake constants
        set_constants({'constant1': 'value1', 'constant2': 'value2'})


@pytest.fixture(autouse=True)
def reset_cache(request):
    """
    Resetts the cache for every test
    """
    if 'django_db' in request.node.keywords or is_django_unittest(request):
        # When the db is created, use the original cachables
        element_cache.ensure_cache(reset=True)
