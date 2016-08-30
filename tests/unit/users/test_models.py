from unittest import TestCase
from unittest.mock import MagicMock, call, patch

from openslides.users.models import User, UserManager


class UserTest(TestCase):
    def test_str(self):
        """
        Tests, that the str representaion of a User object returns the same as
        User.get_full_name().
        """
        user = User()
        user.get_full_name = MagicMock(return_value='Test Value IJee1yoet1ooGhesh5li')

        self.assertEqual(
            str(user),
            'Test Value IJee1yoet1ooGhesh5li',
            "The str representation of User is not user.get_full_name().")


class UserGetFullName(TestCase):
    def test_get_full_name_with_structure_level_and_title(self):
        """
        Tests that get_full_name returns the write string.
        """
        user = User()
        user.title = 'test_title'
        user.structure_level = 'test_structure_level'
        user.get_short_name = MagicMock(return_value='test_short_name')

        self.assertEqual(
            user.get_full_name(),
            'test_title test_short_name (test_structure_level)',
            "User.get_full_name() returns wrong string when it has a "
            "structure_level and title.")

    def test_get_full_name_without_structure_level_and_with_title(self):
        """
        Tests that get_full_name returns the write string.
        """
        user = User()
        user.title = 'test_title'
        user.structure_level = ''
        user.get_short_name = MagicMock(return_value='test_short_name')

        self.assertEqual(
            user.get_full_name(),
            'test_title test_short_name',
            "User.get_full_name() returns wrong string when it has no "
            "structure_level but a title.")

    def test_get_full_name_without_structure_level_and_without_title(self):
        """
        Tests that get_full_name returns the write string.
        """
        user = User()
        user.title = ''
        user.structure_level = ''
        user.get_short_name = MagicMock(return_value='test_short_name')

        self.assertEqual(
            user.get_full_name(),
            'test_short_name',
            "User.get_full_name() returns wrong string when it has no "
            "structure_level and no title.")


class UserGetShortName(TestCase):
    def test_get_short_name_sort_first_name_only_first_name(self):
        """
        Tests the output of get_short_name.
        """
        user = User()
        user.first_name = 'test_first_name'

        with patch('openslides.users.models.config') as mock_config:
            mock_config.__getitem__.return_value = True
            short_name = user.get_short_name()

        self.assertEqual(
            short_name,
            'test_first_name',
            "User.get_short_name() returns wrong string when it has only a "
            "first_name and is sorted by first_name.")

    def test_get_short_name_sort_first_name_both_names(self):
        """
        Tests the output of get_short_name.
        """
        user = User()
        user.first_name = 'test_first_name'
        user.last_name = 'test_last_name'

        with patch('openslides.users.models.config') as mock_config:
            mock_config.__getitem__.return_value = True
            short_name = user.get_short_name()

        self.assertEqual(
            short_name,
            'test_first_name test_last_name',
            "User.get_short_name() returns wrong string when it has a fist_name "
            "and a last_name and is sorted by first_name.")

    def test_get_short_name_sort_last_name_only_first_name(self):
        """
        Tests the output of get_short_name.
        """
        user = User()
        user.first_name = 'test_first_name'

        with patch('openslides.users.models.config') as mock_config:
            mock_config.__getitem__.return_value = False
            short_name = user.get_short_name()

        self.assertEqual(
            short_name,
            'test_first_name',
            "User.get_short_name() returns wrong string when it has only a "
            "first_name and is sorted by last_name.")

    def test_get_short_name_sort_last_name_both_names(self):
        """
        Tests the output of get_short_name.
        """
        user = User()
        user.first_name = 'test_first_name'
        user.last_name = 'test_last_name'

        with patch('openslides.users.models.config') as mock_config:
            mock_config.__getitem__.return_value = False
            short_name = user.get_short_name()

        self.assertEqual(
            short_name,
            'test_last_name, test_first_name',
            "User.get_short_name() returns wrong string when it has a fist_name "
            "and a last_name and is sorted by last_name.")

    def test_get_short_name_no_names(self):
        """
        Tests the output of get_short_name.
        """
        user = User(username='test_username')

        with patch('openslides.users.models.config') as mock_config:
            mock_config.__getitem__.return_value = False
            short_name = user.get_short_name()

        self.assertEqual(
            short_name,
            'test_username',
            "User.get_short_name() returns wrong string when it has no fist_name "
            "and no last_name and is sorted by last_name.")

    def test_while_spaces_in_name_parts(self):
        """
        Tests the output if the name parts have white spaces at the begin or
        end.
        """
        user = User()
        user.first_name = ' test_first_name\n '
        user.last_name = ' test_last_name \n'

        with patch('openslides.users.models.config') as mock_config:
            mock_config.__getitem__.return_value = True
            short_name = user.get_short_name()

        self.assertEqual(
            short_name,
            'test_first_name test_last_name',
            "User.get_short_name() has to strip whitespaces from the name parts.")


class UserManagerTest(TestCase):
    def test_create_user(self):
        """
        Tests that create_user saves a new user with a set password.
        """
        user = MagicMock()
        user_manager = UserManager()
        user_manager.model = MagicMock(return_value=user)
        user_manager._db = 'my_test_db'

        return_user = user_manager.create_user('test_username', 'test_password', test_kwarg='test_kwarg')

        user_manager.model.assert_called_once_with(username='test_username', test_kwarg='test_kwarg')
        user.set_password.assert_called_once_with('test_password')
        user.save.assert_called_once_with(using='my_test_db')
        self.assertEqual(
            return_user,
            user,
            "The returned user is not the created user.")


class UserManagerGenerateUsername(TestCase):
    """
    Tests for the manager method generate_username.
    """
    def setUp(self):
        self.exists_mock = MagicMock()
        self.filter_mock = MagicMock(return_value=self.exists_mock)
        self.manager = UserManager()
        self.manager.filter = self.filter_mock

    def test_clear_strings(self):
        self.exists_mock.exists.return_value = False

        self.assertEqual(
            self.manager.generate_username('wiaf9eecu9mooJiZ3Lah', 'ieHaVe9ci7mooPhe0AuY'),
            'wiaf9eecu9mooJiZ3Lah ieHaVe9ci7mooPhe0AuY')

    def test_unstripped_strings(self):
        self.exists_mock.exists.return_value = False

        self.assertEqual(
            self.manager.generate_username('ouYeuwai0pheukeeShah ', '  Waefa8gahj8ohRaeroca\n'),
            'ouYeuwai0pheukeeShah Waefa8gahj8ohRaeroca',
            "The returned value should only have one whitespace between the "
            "names.")

    def test_empty_second_string(self):
        self.exists_mock.exists.return_value = False

        self.assertEqual(
            self.manager.generate_username('foobar', ''),
            'foobar',
            "The returned value should not have whitespaces at the end.")

    def test_empty_first_string(self):
        self.exists_mock.exists.return_value = False

        self.assertEqual(
            self.manager.generate_username('', 'foobar'),
            'foobar',
            "The returned value should not have whitespaces at the beginning.")

    def test_two_empty_strings(self):
        self.exists_mock.exists.return_value = False

        with self.assertRaises(ValueError,
                               msg="A ValueError should be raised."):
            self.manager.generate_username('', '')

    def test_used_username(self):
        self.exists_mock.exists.side_effect = (True, False)

        self.assertEqual(
            self.manager.generate_username('user', 'name'),
            'user name 1',
            "If the username already exists, a number should be added to the "
            "name.")

    def test_two_used_username(self):
        self.exists_mock.exists.side_effect = (True, True, False)

        self.assertEqual(
            self.manager.generate_username('user', 'name'),
            'user name 2',
            "If the username with a number already exists, a higher number "
            "should be added to the name.")

    def test_umlauts(self):
        self.exists_mock.exists.return_value = False

        self.assertEqual(
            self.manager.generate_username('äöü', 'ßüäö'),
            'äöü ßüäö',
            "The method gen_username has also to work with umlauts.")


@patch('openslides.users.models.choice')
class UserManagerGeneratePassword(TestCase):
    def test_normal(self, mock_choice):
        """
        Test normal run of the method.
        """
        mock_choice.side_effect = tuple('test_password')

        self.assertEqual(
            UserManager().generate_password(),
            'test_pas')
        # choice has to be called 8 times
        mock_choice.assert_has_calls(
            [call("abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789")
             for _ in range(8)])


@patch('openslides.users.models.Permission')
@patch('openslides.users.models.Group')
class UserManagerCreateOrResetAdminUser(TestCase):
    def test_add_admin_group(self, mock_group, mock_permission):
        """
        Tests that the Group with name='Staff' is added to the admin.
        """
        admin_user = MagicMock()
        manager = UserManager()
        manager.get_or_create = MagicMock(return_value=(admin_user, False))

        staff_group = MagicMock(name="Staff")
        mock_group.objects.get_or_create = MagicMock(return_value=(staff_group, True))
        mock_permission.get = MagicMock()

        manager.create_or_reset_admin_user()

        admin_user.groups.add.assert_called_once_with(staff_group)

    def test_password_set_to_admin(self, mock_group, mock_permission):
        """
        Tests that the password of the admin is set to 'admin'.
        """
        admin_user = MagicMock()
        manager = UserManager()
        manager.get_or_create = MagicMock(return_value=(admin_user, False))

        staff_group = MagicMock(name="Staff")
        mock_group.objects.get_or_create = MagicMock(return_value=(staff_group, True))
        mock_permission.get = MagicMock()

        manager.create_or_reset_admin_user()

        self.assertEqual(
            admin_user.default_password,
            'admin')
        admin_user.save.assert_called_once_with()

    @patch('openslides.users.models.User')
    def test_return_value(self, mock_user, mock_group, mock_permission):
        """
        Tests that the method returns True when a user is created.
        """
        admin_user = MagicMock()
        manager = UserManager()
        manager.get_or_create = MagicMock(return_value=(admin_user, True))
        manager.model = mock_user

        staff_group = MagicMock(name="Staff")
        mock_group.objects.get_or_create = MagicMock(return_value=(staff_group, True))
        mock_permission.get = MagicMock()

        self.assertEqual(
            manager.create_or_reset_admin_user(),
            True,
            "The method create_or_reset_admin_user should return True when a "
            "new user is created.")

    @patch('openslides.users.models.User')
    def test_attributes_of_created_user(self, mock_user, mock_group, mock_permission):
        """
        Tests username and last_name of the created admin user.
        """
        admin_user = MagicMock(username='admin', last_name='Administrator')
        manager = UserManager()
        manager.get_or_create = MagicMock(return_value=(admin_user, True))
        manager.model = mock_user

        staff_group = MagicMock(name="Staff")
        mock_group.objects.get_or_create = MagicMock(return_value=(staff_group, True))
        mock_permission.get = MagicMock()

        manager.create_or_reset_admin_user()

        self.assertEqual(
            admin_user.username,
            'admin',
            "The username of a new created admin should be 'admin'.")
        self.assertEqual(
            admin_user.last_name,
            'Administrator',
            "The last_name of a new created admin should be 'Administrator'.")

    def test_get_permissions(self, mock_group, mock_permission):
        """
        Tests if two permissions are get
        """
        admin_user = MagicMock()
        manager = UserManager()
        manager.get_or_create = MagicMock(return_value=(admin_user, True))

        staff_group = MagicMock(name="Staff")
        mock_group.objects.get_or_create = MagicMock(return_value=(staff_group, True))

        permission_mock = MagicMock(name="test permission")
        mock_permission.objects.get = MagicMock(return_value=permission_mock)

        manager.create_or_reset_admin_user()

        self.assertEqual(
            mock_permission.objects.get.call_count,
            2,
            "Permission.get should be called two times")
