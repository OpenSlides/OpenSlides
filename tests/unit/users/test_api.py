from unittest import TestCase
from unittest.mock import patch

from openslides.users.api import get_protected_perm


@patch('openslides.users.api.Permission')
class GetProtectedPerm(TestCase):
    def test_normal(self, mock_permission):
        mock_permission.objects.get_by_natural_key.return_value = 'test_permission'

        value = get_protected_perm()

        mock_permission.objects.get_by_natural_key.assert_called_once_with(
            app_label='users', model='user', codename='can_manage')
        self.assertEqual(
            value,
            'test_permission',
            "The function should return the user.can_manage permission")
