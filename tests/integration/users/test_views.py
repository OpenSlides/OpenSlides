import json

from django.urls import reverse
from rest_framework.test import APIClient

from openslides.utils.test import TestCase


class TestWhoAmIView(TestCase):
    url = reverse("user_whoami")

    def test_get_anonymous(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode()),
            {"user_id": None, "user": None, "guest_enabled": False},
        )

    def test_get_authenticated_user(self):
        self.client.login(username="admin", password="admin")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content.decode()).get("user_id"), 1)
        self.assertEqual(
            json.loads(response.content.decode()).get("guest_enabled"), False
        )

    def test_post(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 405)


class TestUserLogoutView(TestCase):
    url = reverse("user_logout")

    def test_get(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 405)

    def test_post_anonymous(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 400)

    def test_post_authenticated_user(self):
        self.client.login(username="admin", password="admin")
        self.client.session["test_key"] = "test_value"

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(hasattr(self.client.session, "test_key"))


class TestUserLoginView(TestCase):
    url = reverse("user_login")

    def setUp(self):
        self.client = APIClient()

    def test_get(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(json.loads(response.content.decode()).get("info_text"))

    def test_post_no_data(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 400)

    def test_post_correct_data(self):
        response = self.client.post(
            self.url, {"username": "admin", "password": "admin"}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content.decode()).get("user_id"), 1)

    def test_post_incorrect_data(self):
        response = self.client.post(
            self.url, {"username": "wrong", "password": "wrong"}
        )

        self.assertEqual(response.status_code, 400)
