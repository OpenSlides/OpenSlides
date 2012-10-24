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
from openslides.participant.models import User, Group


class UserTest(TestCase):
    def setUp(self):
        self.user1 = User()
        self.user1.first_name = u'Max'
        self.user1.last_name = u'Mustermann'
        self.user1.username = gen_username(
            self.user1.first_name, self.user1.last_name)
        self.user1.default_password = gen_password()
        self.user1.save()
        self.django_user1 = self.user1.django_user

    def test_participant_user(self):
        self.assertEqual(self.django_user1.user, self.user1)
        self.assertEqual(self.django_user1, self.user1.django_user)

    def test_repr(self):
        self.assertEqual(unicode(self.user1), 'Max Mustermann')

    def test_name_surfix(self):
        self.user1.detail = 'München'
        self.user1.save()
        self.assertEqual(unicode(self.user1), 'Max Mustermann (München)')

    def test_reset_password(self):
        self.assertIsInstance(self.user1.default_password, basestring)
        self.assertEqual(len(self.user1.default_password), 8)
        self.user1.set_unusable_password()
        self.assertFalse(self.user1.check_password(self.user1.default_password))
        self.user1.reset_password()
        self.assertTrue(self.user1.check_password(self.user1.default_password))

    def test_person_api(self):
        self.assertTrue(hasattr(self.user1, 'person_id'))
        self.assertEqual(self.user1.person_id, 'user:1')
        self.assertEqual(get_person('user:1'), self.user1)
        self.assertEqual(len(Persons(person_prefix_filter='user')), 1)


class GroupTest(TestCase):
    def setUp(self):
        self.group1 = Group.objects.create(name='Test Group')
        self.django_group1 = self.group1.django_group

    def test_group_group(self):
        self.assertEqual(self.group1.django_group, self.django_group1)
        self.assertEqual(self.group1, self.django_group1.group)

    def test_person_api(self):
        self.assertTrue(hasattr(self.group1, 'person_id'))
        person_id = "group:%d" % self.group1.id
        self.assertEqual(self.group1.person_id, person_id)
        self.assertRaises(Group.DoesNotExist)
        self.group1.group_as_person = True
        self.group1.save()
        self.assertEqual(get_person(person_id), self.group1)
