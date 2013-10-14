#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.assignment.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client

from openslides.agenda.models import Item
from openslides.assignment.models import Assignment
from openslides.participant.models import User
from openslides.utils.test import TestCase


class AssignmentModelTest(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.get(pk=1)
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_delete_with_related_item(self):
        assignment = Assignment.objects.create(name='assignment_name_fgdhensbch34zfu1284ds', posts=1)
        response = self.admin_client.get('/assignment/1/agenda/')
        self.assertRedirects(response, '/agenda/')
        self.assertEqual(Item.objects.get(pk=1).get_title(), 'assignment_name_fgdhensbch34zfu1284ds')
        assignment.delete()
        self.assertTrue(Item.objects.filter(pk=1).exists())
