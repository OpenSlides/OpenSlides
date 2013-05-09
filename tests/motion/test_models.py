#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.motion.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.test import TestCase
from openslides.participant.models import User
from openslides.config.api import config
from openslides.motion.models import Motion, Workflow, State
from openslides.motion.exceptions import WorkflowError


class ModelTest(TestCase):
    def setUp(self):
        self.motion = Motion.objects.create(title='v1')
        self.test_user = User.objects.create(username='blub')
        self.workflow = Workflow.objects.get(pk=1)

    def test_create_new_version(self):
        motion = Motion.objects.create(title='m1')
        self.assertEqual(motion.versions.count(), 1)

        motion.new_version
        motion.save()
        self.assertEqual(motion.versions.count(), 2)

        motion.title = 'new title'
        motion.save()
        self.assertEqual(motion.versions.count(), 2)

        motion.save()
        self.assertEqual(motion.versions.count(), 2)

        motion.text = 'new text'
        motion.new_version
        motion.save()
        self.assertEqual(motion.versions.count(), 3)

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
        motion.new_version
        motion.save()
        v2_version = motion.version
        motion.title = 'v3'
        motion.new_version
        motion.save()
        with self.assertRaises(AttributeError):
            self._title
        self.assertEqual(motion.title, 'v3')

        motion.version = 1
        self.assertEqual(motion.title, 'v1')

        motion.version = v2_version
        self.assertEqual(motion.title, 'v2')

        motion.version = None
        motion.version = None  # Test to set a version to None, which is already None
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
        self.motion.state = State.objects.get(pk=1)
        poll = self.motion.create_poll()
        self.assertEqual(poll.poll_number, 1)

    def test_state(self):
        self.motion.reset_state()
        self.assertEqual(self.motion.state.name, 'submitted')

        self.motion.state = State.objects.get(pk=5)
        self.assertEqual(self.motion.state.name, 'published')
        with self.assertRaises(WorkflowError):
            self.motion.create_poll()

        self.motion.state = State.objects.get(pk=6)
        self.assertEqual(self.motion.state.name, 'permitted')
        self.assertEqual(self.motion.state.get_action_word(), 'Permit')
        with self.assertRaises(WorkflowError):
            self.motion.support(self.test_user)
        with self.assertRaises(WorkflowError):
            self.motion.unsupport(self.test_user)

    def test_new_states_or_workflows(self):
        workflow_1 = Workflow.objects.create(name='W1')
        state_1 = State.objects.create(name='S1', workflow=workflow_1)
        workflow_1.first_state = state_1
        workflow_1.save()
        workflow_2 = Workflow.objects.create(name='W2')
        state_2 = State.objects.create(name='S2', workflow=workflow_2)
        workflow_2.first_state = state_2
        workflow_2.save()
        state_3 = State.objects.create(name='S3', workflow=workflow_1)

        with self.assertRaises(WorkflowError):
            workflow_2.first_state = state_3
            workflow_2.save()

        with self.assertRaises(WorkflowError):
            state_1.next_states.add(state_2)
            state_1.save()

    def test_two_empty_identifiers(self):
        motion1 = Motion.objects.create(title='foo', text='bar', identifier='')
        motion2 = Motion.objects.create(title='foo2', text='bar2', identifier='')

    def test_do_not_create_new_version_when_permit_old_version(self):
        motion = Motion()
        motion.title = 'foo'
        motion.text = 'bar'
        first_version = motion.version
        motion.save()

        motion = Motion.objects.get(pk=motion.pk)
        motion.new_version
        motion.title = 'New Title'
        motion.save()
        new_version = motion.last_version
        self.assertEqual(motion.versions.count(), 2)

        motion.set_active_version(new_version)
        motion.save()
        self.assertEqual(motion.versions.count(), 2)

        motion.set_active_version(first_version)
        motion.version = first_version
        motion.save(ignore_version_data=True)
        self.assertEqual(motion.versions.count(), 2)


class ConfigTest(TestCase):
    def test_stop_submitting(self):
        self.assertFalse(config['motion_stop_submitting'])
