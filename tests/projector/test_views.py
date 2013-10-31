#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.projector.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    TODO: Move this test to the correct place when the projector app is cleaned up.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client, RequestFactory
from mock import call, MagicMock, patch

from openslides.projector.models import ProjectorSlide
from openslides.projector import views
from openslides.utils.test import TestCase


class ProjectorViewTest(TestCase):
    rf = RequestFactory()

    @patch('openslides.projector.views.get_projector_overlays_js')
    @patch('openslides.projector.views.get_projector_overlays')
    @patch('openslides.projector.views.get_projector_content')
    def test_get(self, mock_get_projector_content, mock_get_projector_overlays,
                 mock_get_projector_overlays_js):
        view = views.ProjectorView()
        view.request = self.rf.get('/')

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
        mock_get_projector_overlays.assert_called_with()
        mock_get_projector_overlays_js.assert_called_with()
        self.assertTrue(context['reload'])
        self.assertEqual(context['calls'], 'js_cache')


class ActivateViewTest(TestCase):
    rf = RequestFactory()

    @patch('openslides.projector.views.config')
    @patch('openslides.projector.views.set_active_slide')
    def test_get(self, mock_set_active_slide, mock_config):
        view = views.ActivateView()
        view.request = self.rf.get('/?some_key=some_value')

        view.pre_redirect(view.request, callback='some_callback')

        mock_set_active_slide.called_with('some_callback',
                                          {'some_key': 'some_value'})
        mock_config.get_default.assert_has_calls([call('projector_scroll'),
                                                  call('projector_scale')])
        self.assertEqual(mock_config.__setitem__.call_count, 2)


class SelectWidgetsViewTest(TestCase):
    rf = RequestFactory()

    @patch('openslides.projector.views.SelectWidgetsForm')
    @patch('openslides.projector.views.TemplateView.get_context_data')
    @patch('openslides.projector.views.get_all_widgets')
    def test_get_context_data(self, mock_get_all_widgets, mock_get_context_data,
                              mock_SelectWidgetsForm):
        view = views.SelectWidgetsView()
        view.request = self.rf.get('/')
        view.request.session = MagicMock()
        widget = MagicMock()
        widget.name.return_value = 'some_widget'
        mock_get_all_widgets.return_value = {'some_widget': widget}
        mock_get_context_data.return_value = {}

        # Test get
        context = view.get_context_data()
        self.assertIn('widgets', context)
        self.assertIn('some_widget', context['widgets'])
        mock_SelectWidgetsForm.called_with(
            prefix='some_widget', initial={'widget': True})

        # Test post
        view.request = self.rf.post('/')
        view.request.session = MagicMock()
        context = view.get_context_data()
        mock_SelectWidgetsForm.called_with(
            view.request.POST, prefix='some_widget', initial={'widget': True})

    @patch('openslides.projector.views.messages')
    def test_post(self, mock_messages):
        view = views.SelectWidgetsView()
        view.request = self.rf.post('/')
        view.request.session = {}
        widget = MagicMock()
        widget.name.return_value = 'some_widget'
        context = {'widgets': {'some_widget': widget}}
        mock_context_data = MagicMock(return_value=context)

        with patch('openslides.projector.views.SelectWidgetsView.get_context_data', mock_context_data):
            widget.form.is_valid.return_value = True
            view.post(view.request)
            self.assertIn('some_widget', view.request.session['widgets'])

            # Test with errors in form
            widget.form.is_valid.return_value = False
            view.request.session = {}
            view.post(view.request)
            self.assertNotIn('widgets', view.request.session)
            mock_messages.error.assert_called_with(view.request, 'Errors in the form.')


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


class CustomSlidesTest(TestCase):
    def setUp(self):
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_create(self):
        url = '/projector/new/'
        response = self.admin_client.get(url)
        self.assertTemplateUsed(response, 'projector/new.html')
        response = self.admin_client.post(url, {'title': 'test_title_roo2xi2EibooHie1kohd', 'weight': '0'})
        self.assertRedirects(response, '/projector/dashboard/')
        self.assertTrue(ProjectorSlide.objects.filter(title='test_title_roo2xi2EibooHie1kohd').exists())

    def test_update(self):
        # Setup
        url = '/projector/1/edit/'
        ProjectorSlide.objects.create(title='test_title_jeeDeB3aedei8ahceeso')
        # Test
        response = self.admin_client.get(url)
        self.assertTemplateUsed(response, 'projector/new.html')
        self.assertContains(response, 'test_title_jeeDeB3aedei8ahceeso')
        response = self.admin_client.post(url, {'title': 'test_title_ai8Ooboh5bahr6Ee7goo', 'weight': '0'})
        self.assertRedirects(response, '/projector/dashboard/')
        self.assertEqual(ProjectorSlide.objects.get(pk=1).title, 'test_title_ai8Ooboh5bahr6Ee7goo')

    def test_delete(self):
        # Setup
        url = '/projector/1/del/'
        ProjectorSlide.objects.create(title='test_title_oyie0em1chieM7YohX4H')
        # Test
        response = self.admin_client.get(url)
        self.assertRedirects(response, '/projector/1/edit/')
        response = self.admin_client.post(url, {'yes': 'true'})
        self.assertRedirects(response, '/projector/dashboard/')
        self.assertFalse(ProjectorSlide.objects.exists())
