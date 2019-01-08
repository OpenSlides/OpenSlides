from unittest import TestCase

from openslides.utils import views


class TestAPIView(TestCase):
    def test_class_creation(self):
        """
        Tests that the APIView has all relevant methods
        """
        http_methods = set(
            ("get", "post", "put", "patch", "delete", "head", "options", "trace")
        )

        self.assertTrue(
            http_methods.issubset(views.APIView.__dict__),
            "All http methods should be defined in the APIView",
        )
        self.assertFalse(
            hasattr(views.APIView, "method_call"),
            "The APIView should not have the method 'method_call'",
        )
