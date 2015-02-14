from unittest import TestCase
from unittest.mock import MagicMock, patch

from django.core.exceptions import ImproperlyConfigured
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.test import APIRequestFactory


class UserCreateUpdateSerializer(TestCase):
    def test_improperly_configured_exception_list_request(self):
        """
        Tests that ImproperlyConfigured is raised if one tries to use the
        UserCreateUpdateSerializer with a list request.
        """
        # Global import is not possible for some unknown magic.
        from openslides.users.serializers import UserCreateUpdateSerializer
        factory = APIRequestFactory()
        request = factory.get('/')
        view_class = ModelViewSet
        view_class.queryset = MagicMock()
        view_class.serializer_class = UserCreateUpdateSerializer
        view = view_class.as_view({'get': 'list'})

        with self.assertRaises(ImproperlyConfigured):
            view(request)

    @patch('rest_framework.generics.get_object_or_404')
    def test_improperly_configured_exception_retrieve_request(self, mock_get_object_or_404):
        """
        Tests that ImproperlyConfigured is raised if one tries to use the
        UserCreateUpdateSerializer with a retrieve request.
        """
        # Global import is not possible for some unknown magic.
        from openslides.users.serializers import UserCreateUpdateSerializer
        factory = APIRequestFactory()
        request = factory.get('/')
        view_class = ModelViewSet
        view_class.queryset = MagicMock()
        view_class.serializer_class = UserCreateUpdateSerializer
        view = view_class.as_view({'get': 'retrieve'})
        mock_get_object_or_404.return_value = MagicMock()

        with self.assertRaises(ImproperlyConfigured):
            view(request, pk='1')

    def test_no_improperly_configured_exception_create_request(self):
        """
        Tests that ImproperlyConfigured is not raised if one tries to use the
        UserCreateUpdateSerializer with a create request.
        """
        # Global import is not possible for some unknown magic.
        from openslides.users.serializers import UserCreateUpdateSerializer
        factory = APIRequestFactory()
        request = factory.get('/')
        view_class = ModelViewSet
        view_class.queryset = MagicMock()
        view_class.serializer_class = UserCreateUpdateSerializer
        view = view_class.as_view({'get': 'create'})

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('rest_framework.generics.get_object_or_404')
    def test_no_improperly_configured_exception_update_request(self, mock_get_object_or_404):
        """
        Tests that ImproperlyConfigured is not raised if one tries to use the
        UserCreateUpdateSerializer with a update request.
        """
        # Global import is not possible for some unknown magic.
        from openslides.users.serializers import UserCreateUpdateSerializer
        factory = APIRequestFactory()
        request = factory.get('/')
        view_class = ModelViewSet
        view_class.queryset = MagicMock()
        view_class.serializer_class = UserCreateUpdateSerializer
        view = view_class.as_view({'get': 'update'})
        mock_get_object_or_404.return_value = MagicMock()

        response = view(request, pk='1')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
