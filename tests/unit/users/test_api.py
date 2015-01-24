from unittest import TestCase
from unittest.mock import patch, call, MagicMock

from openslides.users.api import (
    gen_username,
    gen_password,
    get_registered_group,
    create_or_reset_admin_user,
    get_protected_perm)


@patch('openslides.users.api.User')
class UserGenUsername(TestCase):
    """
    Tests for the function gen_username.
    """

    def test_clear_strings(self, mock_user):
        mock_user.objects.filter().exists.return_value = False

        self.assertEqual(
            gen_username('foo', 'bar'),
            'foo bar')

    def test_unstripped_strings(self, mock_user):
        mock_user.objects.filter().exists.return_value = False

        self.assertEqual(
            gen_username('foo ', '  bar\n'),
            'foo bar',
            "The retuned value should only have one whitespace between the names")

    def test_empty_second_string(self, mock_user):
        mock_user.objects.filter().exists.return_value = False

        self.assertEqual(
            gen_username('foobar', ''),
            'foobar',
            "The returned value should not have whitespaces at the end")

    def test_empty_first_string(self, mock_user):
        mock_user.objects.filter().exists.return_value = False

        self.assertEqual(
            gen_username('', 'foobar'),
            'foobar',
            "The returned value should not have whitespaces at the beginning")

    def test_two_empty_strings(self, mock_user):
        mock_user.objects.filter().exists.return_value = False

        with self.assertRaises(ValueError,
                               msg="A ValueError should be raised"):
            gen_username('', '')

    def test_used_username(self, mock_user):
        mock_user.objects.filter().exists.side_effect = (True, False)

        self.assertEqual(
            gen_username('user', 'name'),
            'user name 1',
            "If the username already exist, a number should be added to the name")

    def test_two_used_username(self, mock_user):
        mock_user.objects.filter().exists.side_effect = (True, True, False)

        self.assertEqual(
            gen_username('user', 'name'),
            'user name 2',
            "If the username with a number already exist, a higher number should "
            "be added to the name")

    def test_umlauts(self, mock_user):
        mock_user.objects.filter().exists.return_value = False

        self.assertEqual(
            gen_username('äöü', 'ßüäö'),
            'äöü ßüäö',
            "gen_username has also to work with umlauts")


@patch('openslides.users.api.choice')
class GenPassword(TestCase):
    def test_normal(self, mock_choice):
        """
        Test normal run of the function
        """
        mock_choice.side_effect = tuple('test_password')

        self.assertEqual(
            gen_password(),
            'test_pas')
        # choice has to be called 8 times
        mock_choice.assert_has_calls(
            [call("abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789")
             for _ in range(8)])


@patch('openslides.users.api.Group')
class GetRegisteredGroup(TestCase):
    def test_normal(self, mock_group):
        mock_group.objects.get.return_value = 'test_group'

        self.assertEqual(
            get_registered_group(),
            'test_group')
        mock_group.objects.getassert_called_once_with(pk=2)


@patch('openslides.users.api.Group')
@patch('openslides.users.api.User')
class CreateOrResetAdminUser(TestCase):
    def test_get_admin_group(self, mock_user, mock_group):
        """
        Tests, that the Group with pk4 is added to the admin
        """
        admin_user = MagicMock(name='admin_user')
        mock_user.objects.get.return_value = admin_user
        mock_group.objects.get.return_value = 'admin_group'

        create_or_reset_admin_user()

        mock_group.objects.get.assert_called_once_with(pk=4)
        admin_user.groups.add.assert_called_once_with('admin_group')

    def test_password_set_to_admin(self, mock_user, mock_group):
        """
        Tests, that the password of the admin is set to 'admin'.
        """
        admin_user = MagicMock(name='admin_user')
        mock_user.objects.get.return_value = admin_user

        create_or_reset_admin_user()

        self.assertEqual(
            admin_user.default_password,
            'admin')
        admin_user.set_password.assert_called_once_with('admin')
        admin_user.save.assert_called_once_with()

    def test_return_value(self, mock_user, mock_group):
        """
        Test, that the function retruns True, when a user is created.
        """
        mock_user.DoesNotExist = Exception
        mock_user.objects.get.side_effect = Exception

        self.assertEqual(
            create_or_reset_admin_user(),
            True,
            "create_or_reset_admin_user should return True when a new user is "
            " created")

    def test_attributes_of_created_user(self, mock_user, mock_group):
        admin_user = MagicMock(name='admin_user')
        mock_user.return_value = admin_user
        mock_user.DoesNotExist = Exception
        mock_user.objects.get.side_effect = Exception

        create_or_reset_admin_user()

        self.assertEqual(
            admin_user.username,
            'admin',
            "The username of a new created admin should be 'admin'")
        self.assertEqual(
            admin_user.last_name,
            'Administrator',
            "The last_name of a new created admin should be 'Administrator'")


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
