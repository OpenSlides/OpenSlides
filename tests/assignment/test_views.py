#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.assignment.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client

from openslides.config.api import config
from openslides.utils.test import TestCase
from openslides.assignment.models import Assignment
from openslides.participant.models import User, Group


class AssignmentViewTestCase(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.create_superuser('admin', 'admin@admin.admin', 'admin')
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

        # Staff
        self.staff = User.objects.create_user('staff', 'staff@user.user', 'staff')
        staff_group = Group.objects.get(name='Staff')
        self.staff.groups.add(staff_group)
        self.staff.save()
        self.staff_client = Client()
        self.staff_client.login(username='staff', password='staff')

        # Delegate
        self.delegate = User.objects.create_user('delegate', 'delegate@user.user', 'delegate')
        delegate_group = Group.objects.get(name='Delegates')
        self.delegate.groups.add(delegate_group)
        self.delegate.save()
        self.delegate_client = Client()
        self.delegate_client.login(username='delegate', password='delegate')

        # Registered
        self.registered = User.objects.create_user('registered', 'registered@user.user', 'registered')
        self.registered_client = Client()
        self.registered_client.login(username='registered', password='registered')

        self.assignment1 = Assignment.objects.create(name='test', posts=2)

    def check_url(self, url, test_client, response_cose):
        response = test_client.get(url)
        self.assertEqual(response.status_code, response_cose)
        return response


class TestAssignmentPollDelete(AssignmentViewTestCase):
    def setUp(self):
        super(TestAssignmentPollDelete, self).setUp()
        self.assignment1.gen_poll()

    def test_get(self):
        response = self.check_url('/assignment/poll/1/del/', self.admin_client, 302)
        self.assertRedirects(response, 'assignment/1/')

    def test_post(self):
        response = self.admin_client.post('/assignment/poll/1/del/', {'yes': 1})
        self.assertRedirects(response, '/assignment/1/')
