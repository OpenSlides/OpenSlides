from unittest import TestCase, skip
from unittest.mock import MagicMock, patch

from openslides.utils.auth import AnonymousUser, get_user


@skip  # I don't know how to patch the config if it is not imported in the global space
@patch('openslides.utils.auth.config')
@patch('openslides.utils.auth._get_user')
class TestGetUser(TestCase):
    def test_not_in_cache(self, mock_get_user, mock_config):
        mock_config.__getitem__.return_value = True
        mock_get_user.return_value = AnonymousUser()
        request = MagicMock()
        del request._cached_user

        user = get_user(request)

        mock_get_user.assert_called_once_with(request)
        self.assertEqual(user, AnonymousUser())
        self.assertEqual(request._cached_user, AnonymousUser())

    def test_in_cache(self, mock_get_user, mock_config):
        request = MagicMock()
        request._cached_user = 'my_user'

        user = get_user(request)

        self.assertFalse(
            mock_get_user.called,
            "_get_user should not have been called when the user object is in cache")
        self.assertEqual(
            user,
            'my_user',
            "The user in cache should be returned")

    def test_disabled_anonymous_user(self, mock_get_user, mock_config):
        mock_config.__getitem__.return_value = False
        mock_get_user.return_value = 'django_anonymous_user'
        request = MagicMock()
        del request._cached_user

        user = get_user(request)

        mock_get_user.assert_called_once_with(request)
        self.assertEqual(
            user,
            'django_anonymous_user',
            "The django user should be returned")
        self.assertEqual(
            request._cached_user,
            'django_anonymous_user',
            "The django user should be cached")
