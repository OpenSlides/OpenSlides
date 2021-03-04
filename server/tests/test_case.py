import random
import string

from django.contrib.auth import get_user_model
from django.test import TestCase as _TestCase
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.utils.autoupdate import inform_changed_data
from tests.common_groups import GROUP_ADMIN_PK, GROUP_DELEGATE_PK
from tests.count_queries import AssertNumQueriesContext


class TestCase(_TestCase):
    maxDiff = None

    def setUp(self):
        self.admin = get_user_model().objects.get(username="admin")
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.advancedSetUp()

    def advancedSetUp(self):
        pass

    def create_guest_client(self):
        config["general_system_enable_anonymous"] = True
        return APIClient()

    """
    Adds testing for autoupdates after requests.
    """

    def assertNumQueries(self, num, func=None, *args, verbose=False, **kwargs):
        context = AssertNumQueriesContext(self, num, verbose)
        if func is None:
            return context

        with context:
            func(*args, **kwargs)

    def assertHttpStatusVerbose(self, response, status):
        if response.status_code != status:
            print(response.data)
        self.assertEqual(response.status_code, status)

    """
    Create Helper functions
    """

    def create_user(self):
        password = "test_password_" + self._get_random_string()
        return (
            get_user_model().objects.create_user(
                username="test_user_" + self._get_random_string(), password=password
            ),
            password,
        )

    def make_admin_delegate(self):
        admin = get_user_model().objects.get(username="admin")
        admin.groups.add(GROUP_DELEGATE_PK)
        admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(admin)

    def _get_random_string(self, length=20):
        return "".join(
            random.choices(
                string.ascii_lowercase + string.ascii_uppercase + string.digits,
                k=length,
            )
        )
