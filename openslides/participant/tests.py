#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.tests
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Unit test for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.hashers import check_password

from openslides.utils.person import get_person, Persons
from openslides.participant.api import gen_username, gen_password
from openslides.participant.models import OpenSlidesUser, OpenSlidesGroup


class OpenSlidesUserTest(TestCase):
    def setUp(self):
        self.openslidesuser1 = OpenSlidesUser()
        self.openslidesuser1.first_name = u'Max'
        self.openslidesuser1.last_name = u'Mustermann'
        self.openslidesuser1.username = gen_username(
            self.openslidesuser1.first_name, self.openslidesuser1.last_name)
        self.openslidesuser1.firstpassword = gen_password()
        self.openslidesuser1.save()
        self.user1 = self.openslidesuser1.user

    def test_participant_user(self):
        self.assertEqual(self.user1.openslidesuser, self.openslidesuser1)
        self.assertEqual(self.user1, self.openslidesuser1.user)

    def test_repr(self):
        self.assertEqual(unicode(self.openslidesuser1), u'Max Mustermann')

    def test_name_surfix(self):
        self.openslidesuser1.category = u'München'
        self.openslidesuser1.save()
        self.assertEqual(unicode(self.openslidesuser1), u'Max Mustermann (München)')

    def test_reset_password(self):
        self.assertIsInstance(self.openslidesuser1.firstpassword, basestring)
        self.assertEqual(len(self.openslidesuser1.firstpassword), 8)
        self.user1.set_unusable_password()
        self.assertFalse(self.user1.check_password(self.openslidesuser1.firstpassword))
        self.openslidesuser1.reset_password()
        self.assertTrue(self.user1.check_password(self.openslidesuser1.firstpassword))

    def test_person_api(self):
        self.assertTrue(hasattr(self.openslidesuser1, 'person_id'))
        self.assertEqual(self.openslidesuser1.person_id, 'openslides_user:1')
        self.assertEqual(get_person('openslides_user:1'), self.openslidesuser1)
        self.assertEqual(len(Persons(person_prefix='openslides_user')), 1)


class OpenSlidesGroupTest(TestCase):
    def setUp(self):
        self.openslidesgroup1 = OpenSlidesGroup.objects.create(name='Test Group')
        self.group1 = self.openslidesgroup1.group

    def test_group_openslidesgroup(self):
        self.assertEqual(self.openslidesgroup1.group, self.group1)

    def test_person_api(self):
        self.assertTrue(hasattr(self.openslidesgroup1, 'person_id'))
        person_id = "openslides_group:%d" % self.openslidesgroup1.id
        self.assertEqual(self.openslidesgroup1.person_id, person_id)
        self.assertEqual(get_person(person_id), self.openslidesgroup1)
