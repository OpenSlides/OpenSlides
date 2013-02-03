#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.motion.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test import TestCase

from openslides.participant.models import User
from openslides.config.models import config
from openslides.motion.models import Motion
from openslides.motion.workflow import WorkflowError


class ModelTest(TestCase):
    def setUp(self):
        self.motion = Motion.objects.create(title='v1')
        self.test_user = User.objects.create(username='blub')

    def test_create_new_version(self):
        config['motion_create_new_version'] = 'ALLWASY_CREATE_NEW_VERSION'
        motion = Motion.objects.create(title='m1')
        self.assertEqual(motion.versions.count(), 1)

        motion.new_version
        motion.save()
        self.assertEqual(motion.versions.count(), 2)

        motion.title = 'new title'
        motion.save()
        self.assertEqual(motion.versions.count(), 3)

        motion.save()
        self.assertEqual(motion.versions.count(), 3)

        config['motion_create_new_version'] = 'NEVER_CREATE_NEW_VERSION'
        motion.text = 'new text'
        motion.save()
        self.assertEqual(motion.versions.count(), 3)

    def test_version_data(self):
        motion = Motion()
        self.assertEqual(motion.title, '')
        with self.assertRaises(AttributeError):
            self._title

        motion.title = 'title'
        self.assertEqual(motion._title, 'title')

        motion.reason = 'reason'
        self.assertEqual(motion._reason, 'reason')

    def test_version(self):
        motion = Motion.objects.create(title='v1')
        motion.title = 'v2'
        motion.save()
        v2_version = motion.version
        motion.title = 'v3'
        motion.save()
        with self.assertRaises(AttributeError):
            self._title
        self.assertEqual(motion.title, 'v3')

        motion.version = 1
        self.assertEqual(motion.title, 'v1')

        motion.version = v2_version
        self.assertEqual(motion.title, 'v2')

        motion.version = None
        motion.version = None # Test to set a version to None, which is already None
        self.assertEqual(motion.title, 'v3')

        with self.assertRaises(ValueError):
            motion.version = 'wrong'

    def test_absolute_url(self):
        motion_id = self.motion.id

        self.assertEqual(self.motion.get_absolute_url('detail'), '/motion/%d/' % motion_id)
        self.assertEqual(self.motion.get_absolute_url('edit'), '/motion/%d/edit/' % motion_id)
        self.assertEqual(self.motion.get_absolute_url('delete'), '/motion/%d/del/' % motion_id)

    def test_supporter(self):
        self.assertFalse(self.motion.is_supporter(self.test_user))
        self.motion.support(self.test_user)
        self.assertTrue(self.motion.is_supporter(self.test_user))
        self.motion.unsupport(self.test_user)
        self.assertFalse(self.motion.is_supporter(self.test_user))
        self.motion.unsupport(self.test_user)

    def test_poll(self):
        self.motion.state = 'per'
        poll = self.motion.create_poll()
        self.assertEqual(poll.poll_number, 1)

    def test_state(self):
        self.motion.reset_state()
        self.assertEqual(self.motion.state.id, 'pub')

        with self.assertRaises(WorkflowError):
            self.motion.create_poll()

        self.motion.set_state('per')
        self.assertEqual(self.motion.state.id, 'per')
        with self.assertRaises(WorkflowError):
            self.motion.support(self.test_user)
        with self.assertRaises(WorkflowError):
            self.motion.unsupport(self.test_user)

        with self.assertRaises(WorkflowError):
            self.motion.set_state('per')

