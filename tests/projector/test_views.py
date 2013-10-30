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
from mock import call, patch

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
