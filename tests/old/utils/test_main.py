import os
import sys
from unittest.mock import MagicMock, patch

from openslides.utils import main
from openslides.utils.test import TestCase


class TestFunctions(TestCase):
    @patch('openslides.utils.main.sys')
    def test_detect_openslides_type_unix(self, mock_sys):
        """
        Tests the return value on a unix system.
        """
        mock_sys.platform = 'linux'
        self.assertEqual(main.detect_openslides_type(), main.UNIX_VERSION)

    @patch('openslides.utils.main.os.path.basename')
    @patch('openslides.utils.main.sys')
    def test_detect_openslides_type_win_portable(self, mock_sys, mock_os):
        """
        Tests the return value on a windows portable system.
        """
        mock_sys.platform = 'win32'
        mock_os.return_value = 'openslides.exe'
        self.assertEqual(main.detect_openslides_type(), main.WINDOWS_PORTABLE_VERSION)

    @patch('openslides.utils.main.os.path.basename')
    @patch('openslides.utils.main.sys')
    def test_detect_openslides_type_win(self, mock_sys, mock_os):
        """
        Tests the return value on a windows system.
        """
        mock_sys.platform = 'win32'
        mock_os.return_value = 'python'
        self.assertEqual(main.detect_openslides_type(), main.WINDOWS_VERSION)

    @patch('openslides.utils.main.detect_openslides_type')
    @patch('openslides.utils.main.os.path.expanduser')
    def test_get_default_settings_path_unix(self, mock_expanduser, mock_detect):
        mock_expanduser.return_value = '/home/test/.config'
        self.assertEqual(main.get_default_settings_path(main.UNIX_VERSION),
                         '/home/test/.config/openslides/settings.py')

    @patch('openslides.utils.main.get_win32_app_data_path')
    def test_get_default_settings_path_win(self, mock_win):
        mock_win.return_value = 'win32'
        self.assertEqual(main.get_default_settings_path(main.WINDOWS_VERSION),
                         'win32/openslides/settings.py')

    @patch('openslides.utils.main.get_win32_portable_path')
    def test_get_default_settings_path_portable(self, mock_portable):
        mock_portable.return_value = 'portable'
        self.assertEqual(main.get_default_settings_path(main.WINDOWS_PORTABLE_VERSION),
                         'portable/openslides/settings.py')

    def test_get_local_settings_path(self):
        self.assertEqual(main.get_local_settings_path(), os.sep.join(('personal_data', 'var', 'settings.py')))

    def test_setup_django_settings_module(self):
        main.setup_django_settings_module('test_dir_dhvnghfjdh456fzheg2f/test_path_bngjdhc756dzwncshdfnx.py')

        self.assertEqual(os.environ['DJANGO_SETTINGS_MODULE'], 'test_path_bngjdhc756dzwncshdfnx')
        self.assertEqual(sys.path[0], os.path.abspath('test_dir_dhvnghfjdh456fzheg2f'))

    @patch('openslides.utils.main.detect_openslides_type')
    def test_get_default_settings_context_portable(self, detect_mock):
        detect_mock.return_value = main.WINDOWS_PORTABLE_VERSION
        context = main.get_default_settings_context()
        self.assertEqual(context['openslides_user_data_path'], 'get_win32_portable_user_data_path()')

    def test_get_default_user_data_path(self):
        self.assertIn(os.path.join('.local', 'share'), main.get_default_user_data_path(main.UNIX_VERSION))

    @patch('openslides.utils.main.threading.Thread')
    @patch('openslides.utils.main.time')
    @patch('openslides.utils.main.webbrowser')
    def test_start_browser(self,  mock_webbrowser, mock_time, mock_Thread):
        browser_mock = MagicMock()
        mock_webbrowser.get.return_value = browser_mock

        main.start_browser('http://localhost:8234')

        self.assertTrue(mock_Thread.called)
        inner_function = mock_Thread.call_args[1]['target']
        inner_function()
        browser_mock.open.assert_called_with('http://localhost:8234')
