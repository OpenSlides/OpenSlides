#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.projector.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    TODO: Move this test to the correct place when the projector app is cleaned up.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client

from openslides.projector.models import ProjectorSlide
from openslides.utils.test import TestCase


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
