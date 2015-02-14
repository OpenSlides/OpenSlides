from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.users.models import User
from openslides.utils.test import TestCase


class UserCreation(TestCase):
    """
    Tests creation of users via REST API.
    """
    def test_simple_creation(self):
        self.client.login(username='admin', password='admin')

        response = self.client.post(
            reverse('user-list'),
            {'last_name': 'Test name keimeiShieX4Aekoe3do'})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='Test name keimeiShieX4Aekoe3do').exists())

    def test_creation_with_group(self):
        self.client.login(username='admin', password='admin')

        self.client.post(
            reverse('user-list'),
            {'last_name': 'Test name aedah1iequoof0Ashed4',
             'groups': ['3', '4']})

        user = User.objects.get(username='Test name aedah1iequoof0Ashed4')
        self.assertTrue(user.groups.filter(pk=3).exists())
        self.assertTrue(user.groups.filter(pk=4).exists())

    def test_creation_with_anonymous_or_registered_group(self):
        self.client.login(username='admin', password='admin')

        response = self.client.post(
            reverse('user-list'),
            {'last_name': 'Test name aedah1iequoof0Ashed4',
             'groups': ['1', '2']})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'groups': ["Invalid pk '1' - object does not exist."]})


class UserUpdate(TestCase):
    """
    Tests update of users via REST API.
    """
    def test_simple_update_via_patch(self):
        admin_client = APIClient()
        admin_client.login(username='admin', password='admin')

        response = admin_client.patch(
            reverse('user-detail', args=['1']),
            {'last_name': 'New name tu3ooh5Iez5Aec2laefo'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=1)
        self.assertEqual(user.last_name, 'New name tu3ooh5Iez5Aec2laefo')
        self.assertEqual(user.username, 'admin')

    def test_simple_update_via_put(self):
        admin_client = APIClient()
        admin_client.login(username='admin', password='admin')

        response = admin_client.put(
            reverse('user-detail', args=['1']),
            {'last_name': 'New name Ohy4eeyei5Sahzah0Os2'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'username': ['This field is required.']})


class UserDelete(TestCase):
    """
    Tests delete of users via REST API.
    """
    def test_delete(self):
        admin_client = APIClient()
        admin_client.login(username='admin', password='admin')
        User.objects.create(username='Test name bo3zieT3iefahng0ahqu')
        self.assertTrue(User.objects.filter(username='Test name bo3zieT3iefahng0ahqu').exists())

        response = admin_client.delete(reverse('user-detail', args=['2']))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(username='Test name bo3zieT3iefahng0ahqu').exists())
