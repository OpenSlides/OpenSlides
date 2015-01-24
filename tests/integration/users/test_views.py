from openslides.utils.test import TestCase
from django.test.client import Client


class UserViews(TestCase):
    def setUp(self):
        self.client = Client()
        self.client.login(username='admin', password='admin')

    def test_user_list(self):
        response = self.client.get('/user/')

        self.assertTemplateUsed(response, 'users/user_list.html')
        self.assertEqual(response.status_code, 200)
