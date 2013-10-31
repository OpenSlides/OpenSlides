# -*- coding: utf-8 -*-

from django.test.client import Client
from django.test.utils import override_settings

from openslides.participant.models import Group, User
from openslides.utils.test import TestCase


@override_settings(PASSWORD_HASHERS=('django.contrib.auth.hashers.PBKDF2PasswordHasher',))
class TestUmlautUser(TestCase):
    """
    Tests persons with umlauts in there name.
    """

    def setUp(self):
        self.user = User.objects.create(username='äöü')
        self.user.reset_password('äöü')
        self.client = Client()
        self.client.login(username='äöü', password='äöü')

    def test_login(self):
        client = Client()
        response = client.post('/login/', {'username': 'äöü',
                                           'password': 'äöüß'})
        self.assertEqual(response.status_code, 200)

        response = client.post('/login/', {'username': 'äöü',
                                           'password': 'äöü'})
        self.assertEqual(response.status_code, 302)

    def test_logout(self):
        response = self.client.get('/logout/')
        self.assertEqual(response.status_code, 302)

    def test_permission(self):
        response = self.client.get('/participant/1/edit/')
        self.assertEqual(response.status_code, 403)

        self.user.groups.add(Group.objects.get(pk=4))

        response = self.client.get('/participant/1/edit/')
        self.assertEqual(response.status_code, 200)
