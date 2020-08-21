from typing import List
from unittest import TestCase

from openslides.users.user_backend import (
    BaseUserBackend,
    UserBackendException,
    UserBackendManager,
)


class TUserBackend(BaseUserBackend):

    disallowed_update_keys = ["test_key1", "another_test_key"]

    @property
    def name(self) -> str:
        return "test_backend"

    def get_disallowed_update_keys(self) -> List[str]:
        return self.disallowed_update_keys


class UserManagerTest(TestCase):
    def setUp(self):
        self.manager = UserBackendManager()

    def test_register_backend(self):
        self.manager.register_user_backend(TUserBackend())
        self.assertTrue("test_backend" in self.manager.backends)

    def test_get_backend(self):
        backend = TUserBackend()
        self.manager.register_user_backend(backend)
        self.assertEqual(self.manager.get_backend("test_backend"), backend)

    def test_format_backends(self):
        self.manager.register_user_backend(TUserBackend())
        self.assertEqual(
            self.manager.get_backends_for_client(),
            {
                "test_backend": {
                    "disallowedUpdateKeys": TUserBackend.disallowed_update_keys
                }
            },
        )

    def test_register_backend_twice(self):
        self.manager.register_user_backend(TUserBackend())
        self.assertRaises(
            UserBackendException, self.manager.register_user_backend, TUserBackend()
        )

    def test_get_unknown_backend(self):
        self.assertRaises(
            UserBackendException, self.manager.get_backend, "unknwon_backend"
        )
