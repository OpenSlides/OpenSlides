#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.core.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client

from openslides.utils.test import TestCase
from openslides import __version__
from openslides.participant.models import User


class VersionViewTest(TestCase):
    def test_get(self):
        user = User.objects.create_user('CoreMaximilian', 'xxx@xx.xx', 'default')
        client = Client()
        client.login(username='CoreMaximilian', password='default')
        response = client.get('/version/')
        self.assertContains(response, __version__, status_code=200)
