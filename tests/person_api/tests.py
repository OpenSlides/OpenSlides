#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.person_api.tests
    ~~~~~~~~~~~~~~~~~~~~~~~

    Unit test for the person api.

    :copyright: 2011 - 2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib.auth.models import AnonymousUser

from openslides.utils.person.api import get_person
from openslides.utils.test import TestCase

from .models import TestModel, TestPerson


class PersonTest(TestCase):
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

    def test_get_absolute_url_with_deleted_person(self):
        person2 = TestPerson.objects.create(name='test2')
        self.assertEqual(person2.get_absolute_url(), 'absolute_url_of_test_person')
        person_id = person2.person_id
        self.assertEqual(get_person(person_id).get_absolute_url(), 'absolute_url_of_test_person')
        person2.delete()
        with self.assertRaisesRegexp(ValueError, 'This person object has no url.'):
            get_person(person_id).get_absolute_url()
