# -*- coding: utf-8 -*-

import os
import sys

from django.core.exceptions import ImproperlyConfigured
from mock import MagicMock, patch

from openslides.__main__ import (
    add_general_arguments,
    django_command_line_utility,
    runserver,
    start,
    syncdb)
from openslides.utils.main import (
    get_browser_url,
    get_database_path_from_settings,
    get_default_settings_path,
    get_default_user_data_path,
    get_port,
    get_portable_paths,
    get_user_data_path_values,
    setup_django_settings_module,
    start_browser,
    UNIX_VERSION,
    WINDOWS_PORTABLE_VERSION)
from openslides.utils.test import TestCase


class TestFunctions(TestCase):
    def test_get_default_user_data_path(self):
        self.assertIn(os.path.join('.local', 'share'), get_default_user_data_path(UNIX_VERSION))

    def test_get_default_settings_path(self):
        self.assertIn(
            os.path.join('.config', 'openslides', 'settings.py'), get_default_settings_path(UNIX_VERSION))

    def test_get_user_data_path_values_case_one(self):
        values = get_user_data_path_values('/test_path_dfhvndshfgsef', default=False)
        self.assertEqual(values['import_function'], '')
        self.assertIn('database.sqlite', values['database_path_value'])
        self.assertIn('media', values['media_path_value'])
        self.assertIn('whoosh_index', values['whoosh_index_path_value'])

    def test_get_user_data_path_values_case_two(self):
        self.assertEqual(
            get_user_data_path_values('test_path_dfhvndshfgsef', default=True, openslides_type=WINDOWS_PORTABLE_VERSION),
            {'import_function': 'from openslides.utils.main import get_portable_paths',
             'database_path_value': "get_portable_paths('database')",
             'media_path_value': "get_portable_paths('media')",
             'whoosh_index_path_value': "get_portable_paths('whoosh_index')"})

    def test_setup_django_settings_module(self):
        setup_django_settings_module('test_dir_dhvnghfjdh456fzheg2f/test_path_bngjdhc756dzwncshdfnx.py')
        self.assertEqual(os.environ['DJANGO_SETTINGS_MODULE'], 'test_path_bngjdhc756dzwncshdfnx')
        self.assertEqual(sys.path[0], 'test_dir_dhvnghfjdh456fzheg2f')

    def test_setup_django_settings_module_error(self):
        self.assertRaisesMessage(
            ImproperlyConfigured,
            "'.' is not an allowed character in the settings-file",
            setup_django_settings_module,
            'wrong.file.py')

    def test_get_browser_url(self):
        self.assertEqual(get_browser_url('123.456.789.365', 6789), 'http://123.456.789.365:6789')
        self.assertEqual(get_browser_url('123.456.789.365', 80), 'http://123.456.789.365')
        self.assertEqual(get_browser_url('0.0.0.0', 6789), 'http://localhost:6789')
        self.assertEqual(get_browser_url('0.0.0.0', 80), 'http://localhost')

    def test_get_port(self):
        class MyException(Exception):
            pass
        self.assertEqual(get_port('localhost', 8234), 8234)
        with patch('openslides.utils.main.socket') as mock_socket:
            mock_socket.error = MyException
            mock_socket.socket().listen = MagicMock(side_effect=MyException)
            self.assertEqual(get_port('localhost', 80), 8000)

    @patch('openslides.utils.main.threading.Thread')
    @patch('openslides.utils.main.time')
    @patch('openslides.utils.main.webbrowser')
    def test_start_browser(self,  mock_webbrowser, mock_time, mock_Thread):
        browser_mock = MagicMock()
        mock_webbrowser.get.return_value = browser_mock
        start_browser('http://localhost:8234')
        self.assertTrue(mock_Thread.called)
        inner_function = mock_Thread.call_args[1]['target']
        inner_function()
        browser_mock.open.assert_called_with('http://localhost:8234')

    def test_get_database_path_from_settings_memory(self):
        self.assertEqual(get_database_path_from_settings(), ':memory:')

    @patch('openslides.utils.main.get_win32_portable_path')
    def test_get_portable_paths(self, mock_get_win32_portable_path):
        mock_get_win32_portable_path.return_value = '/test_path_AhgheeGee1eixaeYe1ra'
        self.assertEqual(get_portable_paths('database'), '/test_path_AhgheeGee1eixaeYe1ra/openslides/database.sqlite')
        self.assertEqual(get_portable_paths('media'), '/test_path_AhgheeGee1eixaeYe1ra/openslides/media/')
        self.assertEqual(get_portable_paths('whoosh_index'), '/test_path_AhgheeGee1eixaeYe1ra/openslides/whoosh_index/')
        self.assertRaisesMessage(TypeError, 'Unknown type unknown_string', get_portable_paths, 'unknown_string')


class TestOtherFunctions(TestCase):
    """
    Tests functions in openslides.__main__
    """
    def test_add_general_arguments_wrong_arg(self):
        self.assertRaisesMessage(
            TypeError,
            'The argument invalid_argument is not a valid general argument.',
            add_general_arguments,
            None,
            ['invalid_argument'])

    @patch('openslides.__main__.syncdb')
    @patch('openslides.__main__.runserver')
    def test_start(self, mock_runserver, mock_syncdb):
        mock_args = MagicMock()
        start(settings=None, args=mock_args)
        mock_syncdb.assert_called()
        mock_runserver.assert_called_with(None, mock_args)

    @patch('openslides.__main__.run_tornado')
    @patch('openslides.__main__.start_browser')
    def test_runserver(self, mock_start_browser, mock_run_tornado):
        mock_args = MagicMock()
        runserver(settings=None, args=mock_args)
        mock_run_tornado.assert_called()

    @patch('openslides.__main__.os.makedirs')
    @patch('openslides.__main__.execute_from_command_line')
    def test_syncdb(self, mock_execute_from_command_line, mock_os):
        mock_args = MagicMock()
        syncdb(settings=None, args=mock_args)
        mock_execute_from_command_line.assert_called()

    @patch('openslides.__main__.execute_from_command_line')
    def test_django_command_line_utility(self, mock_execute_from_command_line):
        mock_args = MagicMock()
        django_command_line_utility(settings=None, args=mock_args)
        mock_execute_from_command_line.assert_called()
