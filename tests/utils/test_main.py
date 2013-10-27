#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.utils.main
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os
import sys

from django.core.exceptions import ImproperlyConfigured
from mock import patch, MagicMock

from openslides.__main__ import (
    get_default_settings_path,
    get_browser_url,
    get_user_data_path_values,
    setup_django_settings_module)
from openslides.utils.test import TestCase
from openslides.utils.main import (
    get_default_user_data_path, UNIX_VERSION, WINDOWS_PORTABLE_VERSION,
    create_settings)


class TestFunctions(TestCase):
    def test_get_default_user_data_path(self):
        self.assertTrue('.local/share' in get_default_user_data_path(UNIX_VERSION))

    def test_get_default_settings_path(self):
        self.assertTrue('.config/openslides/settings.py' in get_default_settings_path(UNIX_VERSION))

    def test_get_user_data_path_values_case_one(self):
        self.assertEqual(
            get_user_data_path_values('test_path_dfhvndshfgsef', default=False),
            {'local_share': 'test_path_dfhvndshfgsef/openslides'})

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

    @patch('os.makedirs')
    @patch('__builtin__.open')
    def test_create_settings(self, mock_open, mock_makedirs):
        template = MagicMock()
        #template.__mod__.side_effect = lambda x:x
        create_settings(
            '/some/path/to/settings', template,
            local_share='/path/to/local/share/', secret_key='tested_secret_key',
            extra_var='12345')

        context = template.__mod__.call_args[0][0]
        self.assertFalse(context['debug'])
        self.assertEqual(context['secret_key'], 'tested_secret_key')
        self.assertEqual(context['extra_var'], '12345')
        self.assertEqual(context['database_path_value'], '"/path/to/local/share/database.sqlite"')
        self.assertIn('media_path_value', context)
        self.assertIn('whoosh_index_path_value', context)
        mock_open.assert_called_with('/some/path/to/settings', 'w')
        mock_makedirs.assert_called_with('/some/path/to')
