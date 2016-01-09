import json

from rest_framework.test import APIClient

from openslides.utils.test import TestCase


class TestWhoAmIView(TestCase):
    url = '/users/whoami/'

    def test_get_anonymous(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode()),
            {'user_id': None, 'guest_enabled': False})

    def test_get_authenticated_user(self):
        self.client.login(username='admin', password='admin')

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode()),
            {'user_id': 1, 'guest_enabled': False})

    def test_post(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 405)


class TestUserLogoutView(TestCase):
    url = '/users/logout/'

    def test_get(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 405)

    def test_post_anonymous(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 400)

    def test_post_authenticated_user(self):
        self.client.login(username='admin', password='admin')
        self.client.session['test_key'] = 'test_value'

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(hasattr(self.client.session, 'test_key'))


class TestUserLoginView(TestCase):
    url = '/users/login/'

    def setUp(self):
        self.client = APIClient()

    def test_get(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            json.loads(response.content.decode()).get('info_text'))

    def test_post_no_data(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 400)

    def test_post_correct_data(self):
        response = self.client.post(
            self.url,
            {'username': 'admin', 'password': 'admin'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode()),
            {'user_id': 1})

    def test_post_incorrect_data(self):
        response = self.client.post(
            self.url,
            {'username': 'wrong', 'password': 'wrong'})

        self.assertEqual(response.status_code, 400)


class TestUsersPasswordsPDF(TestCase):
    def test_get(self):
        """
        Tests that the view returns the status code 200.
        """
        self.client.login(username='admin', password='admin')
        response = self.client.get('/users/passwords/print/')

        self.assertEqual(
            response.status_code,
            200,
            "The status code of the user password PDF view should be 200.")
