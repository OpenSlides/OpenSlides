from unittest import TestCase
from unittest.mock import patch, MagicMock

from django.core.exceptions import ImproperlyConfigured, PermissionDenied

from openslides.utils import views


@patch('builtins.super')
class LoginMixinTest(TestCase):
    def test_dispatch(self, mock_super):
        """
        Tests that the function calls super
        """
        # TODO: find a way to test the call of the decorator.
        view = views.LoginMixin()
        request = MagicMock()

        view.dispatch(request)

        mock_super().dispatch.assert_called_once_with(request)


class PermissionMixinTest(TestCase):
    def test_check_permission_non_required_permission(self):
        view = views.PermissionMixin()
        view.required_permission = None
        request = MagicMock()

        self.assertTrue(view.check_permission(request))

    def test_check_permission_with_required_permission(self):
        view = views.PermissionMixin()
        view.required_permission = 'required_permission'
        request = MagicMock()

        view.check_permission(request)

        request.user.has_perm.assert_called_once_with('required_permission')

    @patch('builtins.super')
    def test_dispatch_with_perm(self, mock_super):
        view = views.PermissionMixin()
        view.check_permission = MagicMock(return_value=True)
        request = MagicMock()

        view.dispatch(request)

        mock_super().dispatch.called_once_with(request)

    @patch('openslides.utils.views.settings')
    @patch('openslides.utils.views.HttpResponseRedirect')
    @patch('builtins.super')
    def test_dispatch_without_perm_logged_out(self, mock_super, mock_response, mock_settings):
        view = views.PermissionMixin()
        view.check_permission = MagicMock(return_value=False)
        request = MagicMock()
        request.user.is_authenticated.return_value = False
        request.get_full_path.return_value = '/requested/path/'
        mock_settings.LOGIN_URL = 'my_login_url'

        value = view.dispatch(request)

        mock_response.assert_called_once_with('my_login_url?next=/requested/path/')
        self.assertEqual(value, mock_response())

    @patch('openslides.utils.views.settings')
    @patch('openslides.utils.views.HttpResponseRedirect')
    @patch('builtins.super')
    def test_dispatch_without_perm_logged_in(self, mock_super, mock_response, mock_settings):
        view = views.PermissionMixin()
        view.check_permission = MagicMock(return_value=False)
        request = MagicMock()
        request.user.is_authenticated.return_value = True

        with self.assertRaises(PermissionDenied):
            view.dispatch(request)


class AjaxMixinTest(TestCase):
    @patch('openslides.utils.views.json')
    @patch('openslides.utils.views.HttpResponse')
    def test_ajax_get(self, mock_response, mock_json):
        view = views.AjaxMixin()
        view.get_ajax_context = MagicMock(return_value='context')
        mock_json.dumps.return_value = 'json'

        view.ajax_get(MagicMock())

        mock_response.assert_called_once_with('json')
        mock_json.dumps.assert_called_once_with('context')

    def test_get_ajax_context(self):
        view = views.AjaxMixin()

        context = view.get_ajax_context(t1=1, t2=2, t3=3)

        self.assertEqual(context, {'t1': 1, 't2': 2, 't3': 3})


class ExtraContextMixin(TestCase):
    @patch('openslides.utils.views.template_manipulation')
    @patch('builtins.super')
    def test_get_context_data(self, mock_super, mock_signal):
        """
        Tests that super is called with the kwargs, that the signal is called
        with the returnd context and that the context is returned.
        """
        view = views.ExtraContextMixin()
        view.request = 'test_request'
        mock_super().get_context_data.return_value = 'new_context'

        returned_context = view.get_context_data(a1=1, a2=2)

        mock_super().get_context_data.assert_called_once_with(a1=1, a2=2)
        mock_signal.send.assert_called_once_with(
            sender=views.ExtraContextMixin,
            request='test_request',
            context='new_context')
        self.assertEqual(returned_context, 'new_context')


@patch('openslides.utils.views.reverse')
class UrlMixinGetUrl(TestCase):
    """
    Tests the method 'get_url' from the UrlMixin.
    """

    def test_url_name(self, reverse):
        """
        Tests that the return value of reverse(url_pattern) is returned.
        """
        view = views.UrlMixin()
        reverse.return_value = 'reverse_url'

        returned_url = view.get_url('test_url_name')

        reverse.assert_called_once_with('test_url_name', args=[])
        self.assertEqual(returned_url, 'reverse_url')

    def test_url_name_with_args(self, reverse):
        """
        Tests that the return value of reverse(url_pattern) with args is returned.
        """
        view = views.UrlMixin()
        reverse.return_value = 'reverse_url'

        returned_url = view.get_url('test_url_name', args=[1, 2, 3])

        reverse.assert_called_once_with('test_url_name', args=[1, 2, 3])
        self.assertEqual(returned_url, 'reverse_url')

    def test_url(self, reverse):
        view = views.UrlMixin()

        returned_url = view.get_url(url='my_url')

        self.assertFalse(
            reverse.called,
            "reverse should not be called")
        self.assertEqual(returned_url, 'my_url')

    def test_priority_of_url_name(self, reverse):
        view = views.UrlMixin()
        reverse.return_value = 'reverse_url'

        returned_url = view.get_url(url_name='test_url_name', url='my_url')

        reverse.assert_called_once_with('test_url_name', args=[])
        self.assertEqual(returned_url, 'reverse_url')

    def test_get_absolute_url(self, reverse):
        view = views.UrlMixin()
        view.object = MagicMock()
        view.object.get_absolute_url.return_value = 'object_url'

        returned_url = view.get_url()

        view.object.get_absolute_url.assert_called_once_with()
        self.assertEqual(returned_url, 'object_url')
        self.assertFalse(
            reverse.called,
            "reverse should not be called")

    def test_get_absolute_url_with_link(self, reverse):
        view = views.UrlMixin()
        view.object = MagicMock()
        view.object.get_absolute_url.return_value = 'object_url'

        returned_url = view.get_url(use_absolute_url_link='test_link')

        view.object.get_absolute_url.assert_called_once_with('test_link')
        self.assertEqual(returned_url, 'object_url')
        self.assertFalse(
            reverse.called,
            "reverse should not be called")

    def test_get_absolute_url_with_invalid_object(self, reverse):
        view = views.UrlMixin()
        view.object = MagicMock()
        del view.object.get_absolute_url

        with self.assertRaisesRegex(
                ImproperlyConfigured,
                'No url to redirect to\. See openslides\.utils\.views\.UrlMixin '
                'for more details\.'):
            view.get_url()


class UrlMixinGetUrlNameArgs(TestCase):
    """
    Tests the method 'get_url_name_args' from the UrlMixin.
    """

    def test_has_attribute(self):
        view = views.UrlMixin()
        view.url_name_args = 'name_args'

        returned_args = view.get_url_name_args()

        self.assertEqual(
            returned_args,
            'name_args',
            "The object attribute 'url_name_args' should be returned")

    def test_without_attribute_with_object_with_pk(self):
        view = views.UrlMixin()
        view.object = MagicMock()
        view.object.pk = 5

        returned_args = view.get_url_name_args()

        self.assertEqual(
            returned_args,
            [5],
            "object.pk should be returned as a one element list")

    def test_without_attribute_with_object_with_pk_is_none(self):
        view = views.UrlMixin()
        view.object = MagicMock()
        view.object.pk = None

        returned_args = view.get_url_name_args()

        self.assertEqual(
            returned_args,
            [],
            "An empty list should be returned")

    def test_without_attribute_with_object_without_pk(self):
        view = views.UrlMixin()
        view.object = MagicMock()
        del view.object.pk

        returned_args = view.get_url_name_args()

        self.assertEqual(
            returned_args,
            [],
            "An empty list should be returned")

    def test_without_attribute_without_object(self):
        view = views.UrlMixin()

        returned_args = view.get_url_name_args()

        self.assertEqual(
            returned_args,
            [],
            "An empty list should be returned")


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
