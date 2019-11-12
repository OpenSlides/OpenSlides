import random
import string

from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from django.test import TestCase as _TestCase
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.cache import element_cache
from openslides.utils.utils import get_element_id
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

    def get_last_autoupdate(self, user=None):
        """
        Get the last autoupdate as (changed_data, deleted_element_ids) for the given user.
        changed_elements is a dict with element_ids as keys and the actual element as value
        user_id=None if for full data, 0 for the anonymous and regular ids for users.
        """
        user_id = None if user is None else user.id
        current_change_id = async_to_sync(element_cache.get_current_change_id)()
        _changed_elements, deleted_element_ids = async_to_sync(
            element_cache.get_data_since
        )(user_id=user_id, change_id=current_change_id)

        changed_elements = {}
        for collection, elements in _changed_elements.items():
            for element in elements:
                changed_elements[get_element_id(collection, element["id"])] = element

        return (changed_elements, deleted_element_ids)

    def assertAutoupdate(self, model, user=None):
        self.assertTrue(
            model.get_element_id() in self.get_last_autoupdate(user=user)[0]
        )

    def assertDeletedAutoupdate(self, model, user=None):
        self.assertTrue(
            model.get_element_id() in self.get_last_autoupdate(user=user)[1]
        )

    def assertNoAutoupdate(self, model, user=None):
        self.assertFalse(
            model.get_element_id() in self.get_last_autoupdate(user=user)[0]
        )

    def assertNoDeletedAutoupdate(self, model, user=None):
        self.assertFalse(
            model.get_element_id() in self.get_last_autoupdate(user=user)[1]
        )

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
