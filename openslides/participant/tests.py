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
from django.contrib.auth.models import User, Group
from django.db.models.query import EmptyQuerySet
from django.contrib.auth.hashers import check_password

from openslides.utils.user import get_user, Users
from openslides.participant.api import gen_username, gen_password, user2djangouser
from openslides.participant.models import Profile, DjangoGroup, DjangoUser


class ParticipantTest(TestCase):
    def setUp(self):
        self.user1 = User(first_name=u'Max', last_name=u'Mustermann')
        self.user1.username = gen_username(self.user1.first_name, self.user1.last_name)
        self.user1.save()
        self.participant1 = Profile.objects.create(user=self.user1, firstpassword=gen_password())

    def test_participant_user(self):
        self.assertEqual(self.user1.profile, self.participant1)
        self.assertEqual(self.user1, self.participant1.user)

    def test_repr(self):
        self.assertEqual(unicode(self.participant1), u'Max Mustermann')

    def test_group(self):
        self.participant1.group = u'München'
        self.participant1.save()
        self.assertEqual(unicode(self.participant1), u'Max Mustermann (München)')

    def test_reset_password(self):
        self.assertIsInstance(self.participant1.firstpassword, basestring)
        self.assertEqual(len(self.participant1.firstpassword), 8)
        self.user1.set_unusable_password()
        self.assertFalse(self.user1.check_password(self.participant1.firstpassword))
        self.participant1.reset_password()
        self.assertTrue(self.user1.check_password(self.participant1.firstpassword))

    def test_user_api(self):
        self.assertTrue(hasattr(self.participant1, 'uid'))
        self.assertEqual(self.participant1.uid, 'participant:1')
        self.assertEqual(get_user('participant:1'), self.participant1)
        self.assertEqual(len(Users()), 1)


class DjangoGroupTest(TestCase):
    def setUp(self):
        self.group1 = Group.objects.create(name='Test Group')
        self.djangogroup1 = DjangoGroup.objects.create(group=self.group1)

    def test_group_djangogroup(self):
        self.assertEqual(self.djangogroup1.group, self.group1)

    def test_user_api(self):
        self.assertTrue(hasattr(self.djangogroup1, 'uid'))
        self.assertEqual(self.djangogroup1.uid, 'djangogroup:1')
        self.assertEqual(get_user('djangogroup:1'), self.djangogroup1)


class DjangoUserTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create(username='admin')
        self.djangouser1 = DjangoUser.objects.get(pk=1)

    def test_djangouser_user(self):
        self.assertEqual(self.user1.pk, self.djangouser1.pk)

    def test_has_no_profile(self):
        self.assertTrue(self.djangouser1.has_no_profile())

    def test_user_api(self):
        self.assertTrue(hasattr(self.djangouser1, 'uid'))
        self.assertEqual(self.djangouser1.uid, 'djangouser:1')
        self.assertEqual(get_user('djangouser:1'), self.djangouser1)
        self.assertEqual(user2djangouser(self.user1), self.djangouser1)
