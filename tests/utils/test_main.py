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

from openslides.utils.main import (
    get_browser_url,
    get_default_settings_path,
    get_default_user_data_path,
    get_user_data_path_values,
    setup_django_settings_module,
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
