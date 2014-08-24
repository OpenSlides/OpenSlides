from django.contrib.auth.models import AnonymousUser
from django.test.client import Client, RequestFactory
from unittest.mock import MagicMock, patch

from openslides.config.api import config
from openslides.projector import views
from openslides.utils.test import TestCase


class ProjectorViewTest(TestCase):
    rf = RequestFactory()

    @patch('openslides.projector.views.get_projector_overlays_js')
    @patch('openslides.projector.views.get_overlays')
    @patch('openslides.projector.views.get_projector_content')
    def test_get(self, mock_get_projector_content, mock_get_overlays,
                 mock_get_projector_overlays_js):
        view = views.ProjectorView()
        view.request = self.rf.get('/')
        view.request.user = AnonymousUser()

        # Test preview
        view.kwargs = {'callback': 'slide_callback'}
        context = view.get_context_data()
        mock_get_projector_content.assert_called_with(
            {'callback': 'slide_callback'})
        self.assertFalse(context['reload'])

        # Test live view
        view.kwargs = {}
        mock_config = {'projector_js_cache': 'js_cache'}
        with patch('openslides.projector.views.config', mock_config):
            context = view.get_context_data()
        mock_get_projector_content.assert_called_with()
        mock_get_overlays.assert_called_with(only_active=True)
        mock_get_projector_overlays_js.assert_called_with(as_json=True)
        self.assertTrue(context['reload'])
        self.assertEqual(context['calls'], 'js_cache')


class ActivateViewTest(TestCase):
    rf = RequestFactory()

    @patch('openslides.projector.views.call_on_projector')
    @patch('openslides.projector.views.config')
    @patch('openslides.projector.views.set_active_slide')
    def test_get(self, mock_set_active_slide, mock_config, mock_call_on_projector):
        view = views.ActivateView()
        view.request = self.rf.get('/?some_key=some_value')

        view.pre_redirect(view.request, callback='some_callback')

        mock_set_active_slide.assert_called_with('some_callback',
                                                 **{'some_key': 'some_value'})
        mock_config.get_default.assert_has_calls([])
        self.assertEqual(mock_config.__setitem__.call_count, 0)
        self.assertTrue(mock_call_on_projector.called)


class ProjectorControllViewTest(TestCase):
    @patch('openslides.projector.views.call_on_projector')
    def test_bigger(self, mock_call_on_projector):
        view = views.ProjectorControllView()
        request = True  # request is required, but not used in the method
        mock_config = MagicMock()

        mock_config_store = {'projector_scale': 5, 'projector_scroll': 5}

        def getter(key):
            return mock_config_store[key]

        def setter(key, value):
            mock_config_store[key] = value

        mock_config.__getitem__.side_effect = getter
        mock_config.__setitem__.side_effect = setter
        mock_config.get_default.return_value = 0

        self.assertRaises(KeyError, view.pre_redirect, request)
        with patch('openslides.projector.views.config', mock_config):
            view.pre_redirect(request, direction='bigger')
            self.assertEqual(mock_config_store['projector_scale'], 6)
            mock_call_on_projector.assert_called_with({'scroll': 5, 'scale': 6})

            view.pre_redirect(request, direction='smaller')
            self.assertEqual(mock_config_store['projector_scale'], 5)
            mock_call_on_projector.assert_called_with({'scroll': 5, 'scale': 5})

            view.pre_redirect(request, direction='down')
            self.assertEqual(mock_config_store['projector_scroll'], 6)
            mock_call_on_projector.assert_called_with({'scroll': 6, 'scale': 5})

            view.pre_redirect(request, direction='up')
            self.assertEqual(mock_config_store['projector_scroll'], 5)
            mock_call_on_projector.assert_called_with({'scroll': 5, 'scale': 5})

            view.pre_redirect(request, direction='clean_scale')
            self.assertEqual(mock_config_store['projector_scale'], 0)
            mock_call_on_projector.assert_called_with({'scroll': 5, 'scale': 0})

            view.pre_redirect(request, direction='clean_scroll')
            self.assertEqual(mock_config_store['projector_scroll'], 0)
            mock_call_on_projector.assert_called_with({'scroll': 0, 'scale': 0})

    def test_get_ajax_context(self):
        view = views.ProjectorControllView()
        with patch('openslides.projector.views.config', {'projector_scale': 1,
                                                         'projector_scroll': 2}):
            context = view.get_ajax_context()
            self.assertEqual(context, {'scale_level': 1, 'scroll_level': 2})


class CountdownControllView(TestCase):
    def setUp(self):
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    @patch('openslides.projector.views.reset_countdown')
    def test_set_default(self, mock_reset_countdown):
        """
        Test, that the url /countdown/set-default/ sets the time for the countdown
        and reset the countdown.
        """
        self.admin_client.get('/projector/countdown/set-default/', {'countdown_time': 42})
        self.assertEqual(config['countdown_time'], 42)
        mock_reset_countdown.assert_called_with()
