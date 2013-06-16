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
from openslides.participant.models import User, Group, get_protected_perm


class GroupViews(TestCase):
    """
    Tests the detail view for groups and later also the other views.
    """
    def setUp(self):
        self.user_1 = User.objects.get(pk=1)
        self.user_1.first_name = 'admins_first_name'
        self.user_1.save()

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
        pattern = r'admins_first_name Administrator|aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer'
        match = re.findall(pattern, response.content)
        self.assertEqual(match[0], 'admins_first_name Administrator')
        self.assertEqual(match[1], 'aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer')

        config['participant_sort_users_by_first_name'] = True
        self.assertTrue(config['participant_sort_users_by_first_name'])
        response = self.client.get('/participant/group/3/')
        pattern = r'admins_first_name Administrator|aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer'
        match = re.findall(pattern, response.content)
        self.assertEqual(match[1], 'admins_first_name Administrator')
        self.assertEqual(match[0], 'aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer')


class LockoutProtection(TestCase):
    """
    Tests that a manager user can not lockout himself by doing
    something that removes his last permission to manage participants.
    """
    def setUp(self):
        self.user = User.objects.get(pk=1)
        self.user.groups.add(Group.objects.get(pk=4))
        self.client = Client()
        self.client.login(username='admin', password='admin')
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(Group.objects.count(), 4)
        self.assertFalse(self.user.is_superuser)

    def test_delete_yourself(self):
        response = self.client.get('/participant/1/del/')
        self.assertRedirects(response, '/participant/1/')
        self.assertTrue('You can not delete yourself.' in response.cookies['messages'].value)
        response = self.client.post('/participant/1/del/',
                                    {'yes': 'yes'})
        self.assertTrue('You can not delete yourself.' in response.cookies['messages'].value)
        self.assertRedirects(response, '/participant/')
        self.assertEqual(User.objects.count(), 1)

    def test_delete_last_manager_group(self):
        response = self.client.get('/participant/group/4/del/')
        self.assertRedirects(response, '/participant/group/4/')
        self.assertTrue('You can not delete the last group containing the permission '
                        'to manage participants you are in.' in response.cookies['messages'].value)
        response = self.client.post('/participant/group/4/del/',
                                    {'yes': 'yes'})
        self.assertTrue('You can not delete the last group containing the permission '
                        'to manage participants you are in.' in response.cookies['messages'].value)
        self.assertRedirects(response, '/participant/group/')
        self.assertEqual(Group.objects.count(), 4)

    def test_remove_user_from_last_manager_group_via_UserUpdateView(self):
        response = self.client.post('/participant/1/edit/',
                                    {'username': 'arae0eQu8eeghoogeik0',
                                     'groups': '3'})
        self.assertFormError(
            response=response,
            form='form',
            field=None,
            errors='You can not remove the last group containing the permission to manage participants.')

    def test_remove_user_from_last_manager_group_via_GroupUpdateView(self):
        User.objects.get_or_create(username='foo', pk=2)
        response = self.client.post('/participant/group/4/edit/',
                                    {'name': 'ChaeFaev4leephaiChae',
                                     'users': '2'})
        self.assertFormError(
            response=response,
            form='form',
            field=None,
            errors='You can not remove yourself from the last group containing the permission to manage participants.')

    def test_remove_perm_from_last_manager_group(self):
        self.assertNotEqual(get_protected_perm().pk, 90)
        response = self.client.post('/participant/group/4/edit/',
                                    {'name': 'ChaeFaev4leephaiChae',
                                     'users': '1',
                                     'permissions': '90'})
        self.assertFormError(
            response=response,
            form='form',
            field=None,
            errors='You can not remove the permission to manage participants from the last group your are in.')
