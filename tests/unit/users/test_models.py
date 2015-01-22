from unittest import TestCase
from unittest.mock import MagicMock, patch

from openslides.users.models import User, UserManager


class UserTest(TestCase):
    def test_str(self):
        """
        Tests, that the str representaion of a User object returns the same as
        User.get_full_name().
        """
        user = User()
        user.get_full_name = MagicMock(return_value='Test Value')

        self.assertEqual(
            str(user),
            'Test Value',
            "The str representation of User is not user.get_full_name()")

    def test_get_slide_context(self):
        """
        Tests, that get_slide_context returns:

        {'shown_user': self}
        """
        user = User()

        self.assertEqual(
            user.get_slide_context(),
            {'shown_user': user},
            "User.get_slide_context returns a wrong context")


class UserGetAbsoluteUrlTest(TestCase):
    def test_get_absolute_url_default(self):
        """
        Tests get_absolute_url() with no argument.

        It should return the url for the url-pattern of user_detail
        """
        user = User(pk=5)

        with patch('openslides.users.models.reverse') as mock_reverse:
            mock_reverse.return_value = 'test url'
            url = user.get_absolute_url()

        self.assertEqual(
            url,
            'test url',
            "User.get_absolute_url() does not return the result of reverse")
        mock_reverse.assert_called_once_with('user_detail', args=['5'])

    def test_get_absolute_url_detail(self):
        """
        Tests get_absolute_url() with 'detail' as argument
        """
        user = User(pk=5)

        with patch('openslides.users.models.reverse') as mock_reverse:
            mock_reverse.return_value = 'test url'
            url = user.get_absolute_url('detail')

        self.assertEqual(
            url,
            'test url',
            "User.get_absolute_url('detail') does not return the result of reverse")
        mock_reverse.assert_called_once_with('user_detail', args=['5'])

    def test_get_absolute_url_update(self):
        """
        Tests get_absolute_url() with 'update' as argument
        """
        user = User(pk=5)

        with patch('openslides.users.models.reverse') as mock_reverse:
            mock_reverse.return_value = 'test url'
            url = user.get_absolute_url('update')

        self.assertEqual(
            url,
            'test url',
            "User.get_absolute_url('update') does not return the result of reverse")
        mock_reverse.assert_called_once_with('user_update', args=['5'])

    def test_get_absolute_url_delete(self):
        """
        Tests get_absolute_url() with 'delete' as argument
        """
        user = User(pk=5)

        with patch('openslides.users.models.reverse') as mock_reverse:
            mock_reverse.return_value = 'test url'
            url = user.get_absolute_url('delete')

        self.assertEqual(
            url,
            'test url',
            "User.get_absolute_url('delete') does not return the result of reverse")
        mock_reverse.assert_called_once_with('user_delete', args=['5'])

    def test_get_absolute_url_other(self):
        """
        Tests get_absolute_url() with any other argument
        """
        user = User(pk=5)
        dummy_argument = MagicMock()

        with patch('builtins.super') as mock_super:
            mock_super().get_absolute_url.return_value = 'test url'
            url = user.get_absolute_url(dummy_argument)

        self.assertEqual(
            url,
            'test url',
            "User.get_absolute_url(OTHER) does not return the result of reverse")
        mock_super().get_absolute_url.assert_called_once_with(dummy_argument)


class UserGetFullName(TestCase):
    def test_get_full_name_with_structure_level_and_title(self):
        """
        Tests, that get_full_name returns the write string.
        """
        user = User()
        user.title = 'test_title'
        user.structure_level = 'test_structure_level'
        user.get_short_name = MagicMock(return_value='test_short_name')

        self.assertEqual(
            user.get_full_name(),
            'test_title test_short_name (test_structure_level)',
            "User.get_full_name() returns wrong string when it has a structure_level and title")

    def test_get_full_name_without_structure_level_and_with_title(self):
        """
        Tests, that get_full_name returns the write string.
        """
        user = User()
        user.title = 'test_title'
        user.structure_level = ''
        user.get_short_name = MagicMock(return_value='test_short_name')

        self.assertEqual(
            user.get_full_name(),
            'test_title test_short_name',
            "User.get_full_name() returns wrong string when it has no structure_level but a title")

    def test_get_full_name_without_structure_level_and_without_title(self):
        """
        Tests, that get_full_name returns the write string.
        """
        user = User()
        user.title = ''
        user.structure_level = ''
        user.get_short_name = MagicMock(return_value='test_short_name')

        self.assertEqual(
            user.get_full_name(),
            'test_short_name',
            "User.get_full_name() returns wrong string when it has no structure_level and no title")


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
            "first_name and is sorted by first_name")

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
            "and a last_name and is sorted by first_name")

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
            "first_name and is sorted by last_name")

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
            "and a last_name and is sorted by last_name")

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
            "and no last_name and is sorted by last_name")

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
            "User.get_short_name() has to strip whitespaces from the name parts")


class UserResetPassword(TestCase):
    def test_reset_password_no_attribute(self):
        """
        Tests reset_password with no attribute.
        """
        user = User(default_password='test_default_password')
        user.set_password = MagicMock()

        user.reset_password()

        user.set_password.assert_called_once_with('test_default_password')

    def test_reset_password_with_attribute(self):
        """
        Tests reset_password with no attribute.
        """
        user = User(default_password='test_default_password')
        user.set_password = MagicMock()

        user.reset_password('test_password')

        user.set_password.assert_called_once_with('test_password')


class UserManagerTest(TestCase):
    def test_create_user(self):
        """
        Tests, that create_user saves a new user with a set password.
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
            "The returned user is not the created user")
