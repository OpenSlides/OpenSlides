from collections import OrderedDict

from django.http import Http404
from rest_framework import status  # noqa
from rest_framework.decorators import detail_route, list_route  # noqa
from rest_framework.metadata import SimpleMetadata  # noqa
from rest_framework.mixins import ListModelMixin as _ListModelMixin
from rest_framework.mixins import RetrieveModelMixin as _RetrieveModelMixin
from rest_framework.mixins import DestroyModelMixin, UpdateModelMixin  # noqa
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework.serializers import ModelSerializer as _ModelSerializer
from rest_framework.serializers import (  # noqa
    MANY_RELATION_KWARGS,
    CharField,
    DictField,
    Field,
    FileField,
    IntegerField,
    ListField,
    ListSerializer,
    ManyRelatedField,
    PrimaryKeyRelatedField,
    RelatedField,
    SerializerMethodField,
    ValidationError,
)
from rest_framework.viewsets import GenericViewSet as _GenericViewSet  # noqa
from rest_framework.viewsets import ModelViewSet as _ModelViewSet  # noqa
from rest_framework.viewsets import ViewSet as _ViewSet  # noqa

from .auth import user_to_collection_user
from .collection import Collection, CollectionElement

router = DefaultRouter()


class IdManyRelatedField(ManyRelatedField):
    """
    ManyRelatedField that appends an suffix to the sub-fields.

    Only works together with the IdPrimaryKeyRelatedField and our
    ModelSerializer.
    """
    field_name_suffix = '_id'

    def bind(self, field_name, parent):
        """
        Called when the field is bound to the serializer.

        See IdPrimaryKeyRelatedField for more informations.
        """
        self.source = field_name[:-len(self.field_name_suffix)]
        super().bind(field_name, parent)


class IdPrimaryKeyRelatedField(PrimaryKeyRelatedField):
    """
    Field, that renames the field name to FIELD_NAME_id.

    Only works together the our ModelSerializer.
    """
    field_name_suffix = '_id'

    def bind(self, field_name, parent):
        """
        Called when the field is bound to the serializer.

        Changes the source so that the original field name is used (removes
        the _id suffix).
        """
        if field_name:
            # field_name is an empty string when the field is created with the
            # attribute many=True. In this case the suffix is added with the
            # IdManyRelatedField class.
            self.source = field_name[:-len(self.field_name_suffix)]
        super().bind(field_name, parent)

    @classmethod
    def many_init(cls, *args, **kwargs):
        """
        Method from rest_framework.relations.RelatedField That uses our
        IdManyRelatedField class instead of
        rest_framework.relations.ManyRelatedField class.
        """
        list_kwargs = {'child_relation': cls(*args, **kwargs)}
        for key in kwargs.keys():
            if key in MANY_RELATION_KWARGS:
                list_kwargs[key] = kwargs[key]
        return IdManyRelatedField(**list_kwargs)


class PermissionMixin:
    """
    Mixin for subclasses of APIView like GenericViewSet and ModelViewSet.

    The method check_view_permissions is evaluated. If it returns False
    self.permission_denied() is called. Django REST Framework's permission
    system is disabled.

    Also connects container to handle access permissions for model and
    viewset.
    """
    access_permissions = None

    def get_permissions(self):
        """
        Overridden method to check view permissions. Returns an empty
        iterable so Django REST framework won't do any other permission
        checks by evaluating Django REST framework style permission classes
        and the request passes.
        """
        if not self.check_view_permissions():
            self.permission_denied(self.request)
        return ()

    def check_view_permissions(self):
        """
        Override this and return True if the requesting user should be able to
        get access to your view.

        Don't forget to use access permissions container for list and retrieve
        requests.
        """
        return False

    def get_access_permissions(self):
        """
        Returns a container to handle access permissions for this viewset and
        its corresponding model.
        """
        return self.access_permissions

    def get_serializer_class(self):
        """
        Overridden method to return the serializer class given by the
        access permissions container.
        """
        if self.get_access_permissions() is not None:
            serializer_class = self.get_access_permissions().get_serializer_class(self.request.user)
        else:
            serializer_class = super().get_serializer_class()
        return serializer_class


class ModelSerializer(_ModelSerializer):
    """
    ModelSerializer that changes the field names of related fields to
    FIELD_NAME_id.
    """
    serializer_related_field = IdPrimaryKeyRelatedField

    def get_fields(self):
        """
        Returns all fields of the serializer.
        """
        fields = OrderedDict()

        for field_name, field in super().get_fields().items():
            try:
                field_name += field.field_name_suffix
            except AttributeError:
                pass
            fields[field_name] = field
        return fields


class ListModelMixin(_ListModelMixin):
    """
    Mixin to add the caching system to list requests.

    It is not allowed to use the method get_queryset() in derivated classes.
    The attribute queryset has to be used in the following form:

    queryset = Model.objects.all()
    """
    def list(self, request, *args, **kwargs):
        model = self.get_queryset().model
        try:
            collection_string = model.get_collection_string()
        except AttributeError:
            # The corresponding queryset does not support caching.
            response = super().list(request, *args, **kwargs)
        else:
            collection = Collection(collection_string)
            user = user_to_collection_user(request.user)
            response = Response(collection.as_list_for_user(user))
        return response


class RetrieveModelMixin(_RetrieveModelMixin):
    """
    Mixin to add the caching system to retrieve requests.

    It is not allowed to use the method get_queryset() in derivated classes.
    The attribute queryset has to be used in the following form:

    queryset = Model.objects.all()
    """
    def retrieve(self, request, *args, **kwargs):
        model = self.get_queryset().model
        try:
            collection_string = model.get_collection_string()
        except AttributeError:
            # The corresponding queryset does not support caching.
            response = super().retrieve(request, *args, **kwargs)
        else:
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            collection_element = CollectionElement.from_values(
                collection_string, self.kwargs[lookup_url_kwarg])
            user = user_to_collection_user(request.user)
            try:
                content = collection_element.as_dict_for_user(user)
            except collection_element.get_model().DoesNotExist:
                raise Http404
            if content is None:
                self.permission_denied(request)
            response = Response(content)
        return response


class GenericViewSet(PermissionMixin, _GenericViewSet):
    pass


class ModelViewSet(PermissionMixin, ListModelMixin, RetrieveModelMixin, _ModelViewSet):
    pass


class ViewSet(PermissionMixin, _ViewSet):
    pass
