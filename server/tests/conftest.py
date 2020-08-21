import os
from typing import cast

import pytest
from asgiref.sync import async_to_sync
from django.test import TestCase, TransactionTestCase
from pytest_django.django_compat import is_django_unittest
from pytest_django.plugin import validate_django_db

from openslides.utils.cache import element_cache
from openslides.utils.cache_providers import MemoryCacheProvider


# Set an environment variable to stop the startup command
os.environ["NO_STARTUP"] = "1"


def pytest_collection_modifyitems(items):
    """
    Helper until https://github.com/pytest-dev/pytest-django/issues/214 is fixed.
    """

    def get_marker_transaction(test):
        marker = test.get_closest_marker("django_db")
        if marker:
            validate_django_db(marker)
            return marker.kwargs["transaction"]

        return None

    def has_fixture(test, fixture):
        fixturenames = getattr(test, "fixturenames", None)
        return fixturenames and fixture in fixturenames

    def weight_test_case(test):
        """
        Key function for ordering test cases like the Django test runner.
        """
        is_test_case_subclass = test.cls and issubclass(test.cls, TestCase)
        is_transaction_test_case_subclass = test.cls and issubclass(
            test.cls, TransactionTestCase
        )

        if is_test_case_subclass or get_marker_transaction(test) is False:
            return 0
        elif has_fixture(test, "db"):
            return 0

        if is_transaction_test_case_subclass or get_marker_transaction(test) is True:
            return 1
        elif has_fixture(test, "transactional_db"):
            return 1

        return 0

    items.sort(key=weight_test_case)


@pytest.fixture(autouse=True)
def constants(request, reset_cache):
    """
    Resets the constants on every test. The filled cache is needed to
    build the constants, because some of them depends on the config.

    Uses fake constants, if the db is not in use.
    """
    from openslides.utils.constants import get_constants_from_apps, set_constants

    if "django_db" in request.node.keywords or is_django_unittest(request):
        # When the db is created, use the original constants
        set_constants(get_constants_from_apps())
    else:
        # Else: Use fake constants
        set_constants({"constant1": "value1", "constant2": "value2"})


@pytest.fixture(autouse=True)
def reset_cache(request):
    """
    Resetts the cache for every test
    """
    if "django_db" in request.node.keywords or is_django_unittest(request):
        # When the db is created, use the original cachables
        async_to_sync(element_cache.cache_provider.clear_cache)()
        element_cache.ensure_cache(reset=True)

    # Set constant default change_id
    cast(MemoryCacheProvider, element_cache.cache_provider).default_change_id = 1


@pytest.fixture(scope="session", autouse=True)
def set_default_user_backend(request):
    """
    Sets the userbackend once.
    """
    from openslides.users.user_backend import user_backend_manager

    user_backend_manager.collect_backends_from_apps()
