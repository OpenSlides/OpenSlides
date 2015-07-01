from unittest import TestCase
from unittest.mock import MagicMock, patch

from openslides.utils import views


@patch('builtins.super')
class SingleObjectMixinTest(TestCase):
    def test_get_object_cache(self, mock_super):
        """
        Test that the method get_object caches his result.

        Tests that get_object from the django view is only called once, even if
        get_object on our class is called twice.
        """
        view = views.SingleObjectMixin()

        view.get_object()
        view.get_object()

        mock_super().get_object.assert_called_once_with()

    def test_dispatch_with_existin_object(self, mock_super):
        view = views.SingleObjectMixin()
        view.object = 'old_object'
        view.get_object = MagicMock()

        view.dispatch()

        mock_super().dispatch.assert_called_with()
        self.assertEqual(
            view.object,
            'old_object',
            "view.object should not be changed")
        self.assertFalse(
            view.get_object.called,
            "view.get_object() should not be called")

    def test_dispatch_without_existin_object(self, mock_super):
        view = views.SingleObjectMixin()
        view.get_object = MagicMock(return_value='new_object')

        view.dispatch()

        mock_super().dispatch.assert_called_with()
        self.assertEqual(
            view.object,
            'new_object',
            "view.object should be changed")
        self.assertTrue(
            view.get_object.called,
            "view.get_object() should be called")


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
