# -*- coding: utf-8 -*-

from django.test.client import Client, RequestFactory
from mock import MagicMock, patch

from openslides import get_version
from openslides.agenda.models import Item
from openslides.config.api import config
from openslides.core import views
from openslides.participant.models import User
from openslides.utils.test import TestCase


class SelectWidgetsViewTest(TestCase):
    rf = RequestFactory()

    @patch('openslides.core.views.SelectWidgetsForm')
    @patch('openslides.core.views.TemplateView.get_context_data')
    @patch('openslides.core.views.Widget')
    def test_get_context_data(self, mock_Widget, mock_get_context_data,
                              mock_SelectWidgetsForm):
        view = views.SelectWidgetsView()
        view.request = self.rf.get('/')
        view.request.session = MagicMock()
        widget = MagicMock()
        widget.name = 'some_widget_Bohsh1Pa0eeziRaihu8O'
        widget.is_active.return_value = True
        mock_Widget.get_all.return_value = [widget]
        mock_get_context_data.return_value = {}

        # Test get
        context = view.get_context_data()
        self.assertIn('widgets', context)
        self.assertIn(widget, context['widgets'])
        mock_SelectWidgetsForm.assert_called_with(
            prefix='some_widget_Bohsh1Pa0eeziRaihu8O', initial={'widget': True})

        # Test post
        view.request = self.rf.post('/')
        view.request.session = MagicMock()
        context = view.get_context_data()
        mock_SelectWidgetsForm.assert_called_with(
            view.request.POST, prefix='some_widget_Bohsh1Pa0eeziRaihu8O', initial={'widget': True})

    @patch('openslides.core.views.messages')
    def test_post(self, mock_messages):
        view = views.SelectWidgetsView()
        view.request = self.rf.post('/')
        view.request.session = {}
        widget = MagicMock()
        widget.name = 'some_widget_ahgaeree8JeReichue8u'
        context = {'widgets': [widget]}
        mock_context_data = MagicMock(return_value=context)

        with patch('openslides.core.views.SelectWidgetsView.get_context_data', mock_context_data):
            widget.form.is_valid.return_value = True
            view.post(view.request)
            self.assertIn('some_widget_ahgaeree8JeReichue8u', view.request.session['widgets'])

            # Test with errors in form
            widget.form.is_valid.return_value = False
            view.request.session = {}
            view.post(view.request)
            self.assertNotIn('widgets', view.request.session)
            mock_messages.error.assert_called_with(view.request, 'There are errors in the form.')


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
