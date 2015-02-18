from unittest.mock import MagicMock, patch

from django.test.client import Client, RequestFactory

from openslides import __version__ as openslides_version
from openslides.agenda.models import Item
from openslides.config.api import config
from openslides.core import views
from openslides.core.models import CustomSlide
from openslides.users.models import User
from openslides.utils.test import TestCase


class SelectWidgetsViewTest(TestCase):
    rf = RequestFactory()

    @patch('openslides.core.views.SelectWidgetsForm')
    @patch('openslides.core.views.utils_views.TemplateView.get_context_data')
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
        User.objects.create_user('CoreMaximilian', 'default')
        self.client = Client()
        self.client.login(username='CoreMaximilian', password='default')

    def test_get(self):
        response = self.client.get('/version/')
        self.assertContains(response, openslides_version, status_code=200)

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
        User.objects.create_user('CoreMaximilian', 'default')
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


class CustomSlidesTest(TestCase):
    def setUp(self):
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_create(self):
        url = '/customslide/new/'
        response = self.admin_client.get(url)
        self.assertTemplateUsed(response, 'core/customslide_update.html')
        response = self.admin_client.post(
            url,
            {'title': 'test_title_roo2xi2EibooHie1kohd', 'weight': '0'})
        self.assertRedirects(response, '/dashboard/')
        self.assertTrue(CustomSlide.objects.filter(
            title='test_title_roo2xi2EibooHie1kohd').exists())

    def test_update(self):
        # Setup
        url = '/customslide/1/edit/'
        CustomSlide.objects.create(title='test_title_jeeDeB3aedei8ahceeso')
        # Test
        response = self.admin_client.get(url)
        self.assertTemplateUsed(response, 'core/customslide_update.html')
        self.assertContains(response, 'test_title_jeeDeB3aedei8ahceeso')
        response = self.admin_client.post(
            url,
            {'title': 'test_title_ai8Ooboh5bahr6Ee7goo', 'weight': '0'})
        self.assertRedirects(response, '/dashboard/')
        self.assertEqual(CustomSlide.objects.get(pk=1).title,
                         'test_title_ai8Ooboh5bahr6Ee7goo')

    def test_delete(self):
        # Setup
        url = '/customslide/1/del/'
        CustomSlide.objects.create(title='test_title_oyie0em1chieM7YohX4H')
        # Test
        response = self.admin_client.get(url)
        self.assertRedirects(response, '/customslide/1/edit/')
        response = self.admin_client.post(url, {'yes': 'true'})
        self.assertRedirects(response, '/dashboard/')
        self.assertFalse(CustomSlide.objects.exists())


class TagListViewTest(TestCase):
    def test_get_tag_queryset(self):
        view = views.TagListView()

        with patch('openslides.core.views.Tag') as mock_tag:
            view.get_tag_queryset('some_name_with_123', 15)

        self.assertEqual(view.pk, 123)
        mock_tag.objects.filter.assert_called_with(pk=123)

    def test_get_tag_queryset_wrong_name(self):
        view = views.TagListView()

        with patch('openslides.core.views.Tag'):
            with self.assertRaises(views.TagException) as context:
                view.get_tag_queryset('some_name_with_', 15)

        self.assertFalse(hasattr(view, 'pk'))
        self.assertEqual(str(context.exception), 'Invalid name in request')
