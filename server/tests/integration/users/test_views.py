import json

from django.urls import reverse
from rest_framework.test import APIClient

from openslides.users.models import User
from tests.test_case import TestCase


class TestWhoAmIView(TestCase):
    url = reverse("user_whoami")

    def setUp(self):
        pass

    def test_get_anonymous(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode()),
            {
                "auth_type": "default",
                "user_id": None,
                "user": None,
                "permissions": [],
                "guest_enabled": False,
            },
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

    def setUp(self):
        pass

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
        self.assertEqual(
            json.loads(response.content.decode()),
            {
                "auth_type": "default",
                "user_id": None,
                "user": None,
                "permissions": [],
                "guest_enabled": False,
            },
        )


class TestUserLoginView(TestCase):
    url = reverse("user_login")

    def setUp(self):
        self.client = APIClient()

    def test_get(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content.decode())
        self.assertTrue("login_info_text" in content)
        self.assertTrue("privacy_policy" in content)
        self.assertTrue("legal_notice" in content)
        self.assertTrue("theme" in content)
        self.assertTrue("logo_web_header" in content)

    def test_post_no_data(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content.decode())
        self.assertEqual(content.get("detail"), "Username or password is not correct.")

    def test_post_correct_data(self):
        response = self.client.post(
            self.url, {"username": "admin", "password": "admin"}
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content.decode())
        self.assertEqual(content.get("user_id"), 1)
        self.assertTrue(isinstance(content.get("user"), dict))
        self.assertTrue(isinstance(content.get("permissions"), list))
        self.assertFalse(content.get("guest_enabled", True))
        self.assertEqual(content.get("auth_type"), "default")

    def test_post_incorrect_data(self):
        response = self.client.post(
            self.url, {"username": "wrong", "password": "wrong"}
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content.decode())
        self.assertEqual(content.get("detail"), "Username or password is not correct.")

    def test_user_inactive(self):
        admin = User.objects.get()
        admin.is_active = False
        admin.save()

        response = self.client.post(
            self.url, {"username": "admin", "password": "admin"}
        )
        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content.decode())
        self.assertEqual(content.get("detail"), "Your account is not active.")

    def test_user_wrong_auth_type(self):
        admin = User.objects.get()
        admin.auth_type = "not default"
        admin.save()

        response = self.client.post(
            self.url, {"username": "admin", "password": "admin"}
        )
        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content.decode())
        self.assertEqual(
            content.get("detail"), "Please login via your identity provider."
        )

    def test_no_cookies(self):
        response = self.client.post(
            self.url, {"username": "admin", "password": "admin", "cookies": False}
        )
        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content.decode())
        self.assertEqual(
            content.get("detail"), "Cookies have to be enabled to use OpenSlides."
        )
