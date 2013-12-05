# -*- coding: utf-8 -*-

from django.test.client import Client
from mock import patch

from openslides import get_version
from openslides.agenda.models import Item
from openslides.config.api import config
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
        Tests that a not existing app does not appear on the version view.
        """
        mock_settings.INSTALLED_PLUGINS = ('unexisting_app_nvhbkdfgmnsd',)
        self.assertRaises(ImportError, self.client.get, '/version/')


class SearchViewTest(TestCase):
    def test_simple_search(self):
        Item.objects.create(title='agenda_item_bnghfdjkgndkjdfg')
        User.objects.create_user('CoreMaximilian', 'xxx@xx.xx', 'default')
        self.client = Client()
        self.client.login(username='CoreMaximilian', password='default')
        response = self.client.get('/search/?q=agenda_item_bnghfd')
        text = '<span class="highlighted">agenda_item_bnghfd</span>jkgndkjdfg'
        self.assertContains(response, text)

    def test_anonymous(self):
        self.assertFalse(config['system_enable_anonymous'])
        self.assertEqual(Client().get('/search/').status_code, 403)
        config['system_enable_anonymous'] = True
        self.assertEqual(Client().get('/search/').status_code, 200)
