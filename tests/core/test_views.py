#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.core.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client
from mock import MagicMock, patch

from openslides import get_version
from openslides.agenda.models import Item
from openslides.participant.models import User
from openslides.utils.test import TestCase


class VersionViewTest(TestCase):
    def setUp(self):
        User.objects.create_user('CoreMaximilian', 'xxx@xx.xx', 'default')
        self.client = Client()
        self.client.login(username='CoreMaximilian', password='default')

    def test_get(self):
        response = self.client.get('/version/')
        self.assertContains(response, get_version(), status_code=200)

    @patch('openslides.core.views.settings')
    def test_with_missing_plugin(self, mock_settings):
        """
        Tests that an not existing app does not appear on the version view.
        """
        mock_settings.INSTALLED_PLUGINS = ('unexisting_app_nvhbkdfgmnsd',)
        response = self.client.get('/version/')
        self.assertNotContains(response, 'unexisting_app_nvhbkdfgmnsd', status_code=200)

    @patch('openslides.core.views.settings')
    @patch('openslides.core.views.import_module')
    def test_with_plugin_without_version(self, mock_import_module, mock_settings):
        """
        Tests that an exisiting app does not appear in the version view if
        there are no version data.
        """
        mock_settings.INSTALLED_PLUGINS = ('existing_app_without_version',)
        mock_module = MagicMock(spec=['some_useless_attribute_ghbnckj756j36'])
        mock_import_module.configure_mock(return_value=mock_module)
        response = self.client.get('/version/')
        self.assertNotContains(response, 'unexisting_app_nvhbkdfgmnsd', status_code=200)


class SearchViewTest(TestCase):
    def test_simple_search(self):
        Item.objects.create(title='agenda_item_bnghfdjkgndkjdfg')
        User.objects.create_user('CoreMaximilian', 'xxx@xx.xx', 'default')
        self.client = Client()
        self.client.login(username='CoreMaximilian', password='default')
        response = self.client.get('/search/?q=agenda_item_bnghfd')
        text = '<span class="highlighted">agenda_item_bnghfd</span>jkgndkjdfg'
        self.assertContains(response, text)
