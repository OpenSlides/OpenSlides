#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.person_api.tests
    ~~~~~~~~~~~~~~~~~~~~~~~

    Unit test for the person api.

    :copyright: 2011 - 2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client
from django.db.models.query import EmptyQuerySet
from django.contrib.auth.models import AnonymousUser

from openslides.utils.test import TestCase

from .models import TestPerson, TestModel


class ItemTest(TestCase):
    def setUp(self):
        self.person1 = TestPerson.objects.create(name='test1')

    def test_update_of_person_field(self):
        self.assertEqual(self.person1.person_id, 'test:1')

        # save person field
        test_object = TestModel.objects.create(person=self.person1)
        self.assertEqual(test_object.person, self.person1)

        # update person field
        test_object.save()
        self.assertEqual(TestModel.objects.get(pk=test_object.pk).person, self.person1)

    def test_save_anonymous_user_in_person_field(self):
        with self.assertRaisesRegexp(
                AttributeError,
                'An AnonymousUser can not be saved into the database.'):
            TestModel.objects.create(person=AnonymousUser())

    def test_save_unsupported_object_in_person_field(self):
        with self.assertRaisesRegexp(
                AttributeError,
                'You can not save \'<type \'int\'>\' into a person field.'):
            TestModel.objects.create(person=5)
