#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.tests
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Unit tests for the application app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test import TestCase
from django.test.client import Client

from openslides.participant.models import User
from openslides.application.models import Application, AVersion

class ApplicationTest(TestCase):
    def setUp(self):
        self.admin = User(username='testadmin')
        self.admin.save()
        self.anonym = User(username='testanoym')
        self.anonym.save()
        self.app1 = Application(submitter=self.admin)
        self.app1.save()

    def refresh(self):
        self.app1 = Application.objects.get(pk=self.app1.id)

    def testVersion(self):
        self.assertTrue(self.app1.versions.exists())
        self.assertEqual(self.app1.last_version, self.app1.versions[0])
        self.assertEqual(self.app1.creation_time, self.app1.last_version.time)

        self.app1.title = "app1"
        self.app1.save()
        self.refresh()

        self.assertEqual(self.app1.versions.count(), 2)
        self.assertEqual(self.app1.last_version, self.app1.versions[1])

