from unittest.mock import patch

from openslides.utils.test import TestCase


class TestAnonymousRequests(TestCase):
    """
    Test that a request with an user that is not logged in gets only the
    requested data, if the anonymous user is activated in the config.

    Expects that the page '/rest/users/user/' needs a permission and the
    anonymous user has this permission.
    """

    @patch('openslides.users.auth.config', {'general_system_enable_anonymous': True})
    def test_with_anonymous_user(self):
        response = self.client.get('/rest/users/user/')

        self.assertEqual(response.status_code, 200)

    @patch('openslides.users.auth.config', {'general_system_enable_anonymous': False})
    def test_without_anonymous_user(self):
        response = self.client.get('/rest/users/user/')

        self.assertEqual(response.status_code, 403)
