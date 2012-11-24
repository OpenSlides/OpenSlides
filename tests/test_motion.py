#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.tests
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Unit tests for the motion app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test import TestCase

from openslides.participant.models import User
from openslides.motion.models import Motion


class MotionTest(TestCase):
    def setUp(self):
        self.admin = User(username='testadmin')
        self.admin.save()
        self.anonym = User(username='testanoym')
        self.anonym.save()
        self.app1 = Motion(submitter=self.admin)
        self.app1.save()

    def refresh(self):
        self.app1 = Motion.objects.get(pk=self.app1.id)

    def testVersion(self):
        self.assertTrue(self.app1.versions.exists())
        self.assertEqual(self.app1.last_version, self.app1.versions[0])
        self.assertEqual(self.app1.creation_time, self.app1.last_version.time)

        self.app1.title = "app1"
        self.app1.save()
        self.refresh()

        self.assertEqual(self.app1.versions.count(), 2)
        self.assertEqual(self.app1.last_version, self.app1.versions[1])
