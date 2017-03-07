from unittest import TestCase
from unittest.mock import patch

from openslides.utils import views


class TestAPIView(TestCase):
    def test_class_creation(self):
        """
        Tests that the APIView has all relevant methods
        """
        http_methods = set(('get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'))

        self.assertTrue(
            http_methods.issubset(views.APIView.__dict__),
            "All http methods should be defined in the APIView")
        self.assertFalse(
            hasattr(views.APIView, 'method_call'),
            "The APIView should not have the method 'method_call'")


class TestCSRFMixin(TestCase):
    @patch('builtins.super')
    def test_as_view(self, mock_super):
        """
        Tests, that ensure_csrf_cookie is called.
        """
        mock_super().as_view.return_value = 'super_view'
        with patch('openslides.utils.views.ensure_csrf_cookie') as ensure_csrf_cookie:
            views.CSRFMixin.as_view()

        ensure_csrf_cookie.assert_called_once_with('super_view')
