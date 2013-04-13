#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for views of openslides.participant
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import re
from django.test.client import Client

from openslides.config.api import config
from openslides.utils.test import TestCase
from openslides.participant.models import User, Group


class GroupViews(TestCase):
    """
    Tests the detail view for groups and later also the other views.
    """
    def setUp(self):
        self.user_1 = User.objects.create(last_name='chahshah7eiqueip5eiW',
                                          first_name='mi6iu2Te6ei9iohue3ex',
                                          username='mi6iu2Te6ei9iohue3ex chahshah7eiqueip5eiW',
                                          is_superuser=True)
        self.user_2 = User.objects.create(last_name='uquahx3Wohtieph9baer',
                                          first_name='aWei4ien6Se0vie0xeiv',
                                          username='aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer')
        self.delegate = Group.objects.get(pk=3)
        self.user_1.groups.add(self.delegate)
        self.user_2.groups.add(self.delegate)

        self.client = Client()
        login_user = User.objects.create(username='loginusername', is_superuser=True)
        login_user.reset_password('default')
        self.client.login(username='loginusername', password='default')

    def test_detail(self):
        self.assertFalse(config['participant_sort_users_by_first_name'])
        response = self.client.get('/participant/group/3/')
        pattern = r'mi6iu2Te6ei9iohue3ex chahshah7eiqueip5eiW|aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer'
        match = re.findall(pattern, response.content)
        self.assertEqual(match[0], 'mi6iu2Te6ei9iohue3ex chahshah7eiqueip5eiW')
        self.assertEqual(match[1], 'aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer')

        config['participant_sort_users_by_first_name'] = True
        self.assertTrue(config['participant_sort_users_by_first_name'])
        response = self.client.get('/participant/group/3/')
        pattern = r'mi6iu2Te6ei9iohue3ex chahshah7eiqueip5eiW|aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer'
        match = re.findall(pattern, response.content)
        self.assertEqual(match[1], 'mi6iu2Te6ei9iohue3ex chahshah7eiqueip5eiW')
        self.assertEqual(match[0], 'aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer')
