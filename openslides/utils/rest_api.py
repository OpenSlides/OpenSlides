import re
from collections import OrderedDict
from urllib.parse import urlparse

from rest_framework.decorators import detail_route, list_route  # noqa
from rest_framework.metadata import SimpleMetadata  # noqa
from rest_framework.mixins import DestroyModelMixin, UpdateModelMixin  # noqa
from rest_framework.response import Response  # noqa
from rest_framework.routers import DefaultRouter
from rest_framework.serializers import ModelSerializer as _ModelSerializer
from rest_framework.serializers import (  # noqa
    MANY_RELATION_KWARGS,
    CharField,
    DictField,
    Field,
    IntegerField,
    ListField,
    ListSerializer,
    ManyRelatedField,
    PrimaryKeyRelatedField,
    RelatedField,
    SerializerMethodField,
    ValidationError,
)
from rest_framework.viewsets import GenericViewSet as _GenericViewSet
from rest_framework.viewsets import ModelViewSet as _ModelViewSet
from rest_framework.viewsets import \
    ReadOnlyModelViewSet as _ReadOnlyModelViewSet
from rest_framework.viewsets import ViewSet as _ViewSet
from rest_framework.viewsets import ViewSetMixin

from .class_register import RegisterSubclasses
from .exceptions import OpenSlidesError

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


class PermissionMixin:
    """
    Mixin for subclasses of APIView like GenericViewSet and ModelViewSet.

    The methods check_view_permissions or check_projector_requirements are
    evaluated. If both return False self.permission_denied() is called.
    Django REST framework's permission system is disabled.
    """

    def get_permissions(self):
        """
        Overriden method to check view and projector permissions. Returns an
        empty interable so Django REST framework won't do any other
        permission checks by evaluating Django REST framework style permission
        classes  and the request passes.
        """
        if not self.check_view_permissions() and not self.check_projector_requirements():
            self.permission_denied(self.request)
        return ()

    def check_view_permissions(self):
        """
        Override this and return True if the requesting user should be able to
        get access to your view.
        """
        return False

    def check_projector_requirements(self):
        """
        Helper method which returns True if the current request (on this
        view instance) is required for at least one active projector element.
        """
        from openslides.core.models import Projector

        result = False
        if self.request.user.has_perm('core.can_see_projector'):
            for requirement in Projector.get_all_requirements():
                if requirement.is_currently_required(view_instance=self):
                    result = True
                    break
        return result


class GenericViewSet(PermissionMixin, _GenericViewSet):
    pass


class ModelViewSet(PermissionMixin, _ModelViewSet):
    pass


class ReadOnlyModelViewSet(PermissionMixin, _ReadOnlyModelViewSet):
    pass


class ViewSet(PermissionMixin, _ViewSet):
    pass


class RESTElement(metaclass=RegisterSubclasses):
    """
    Element of our REST api.

    Each element bundels a viewset, a route and optionally a model together.
    """

    viewset = None
    """
    A django REST framework viewset class used in the router.
    """

    router_prefix = None
    """
    This attribute has to be set if the defined viewset has no queryset. It is
    used as prefix for the django REST framework router. See:

    http://www.django-rest-framework.org/api-guide/routers/#usage

    It is also used as second part of the collection_name if the specified
    viewset has no queryset attribute.
    """

    app_label = None
    """
    This attribute has to be set if the defined viewset has no queryset. It is
    used to generate the collection name.
    """

    @classmethod
    def get_model(cls):
        """
        Returns the model used in the viewset.
        """
        viewset = cls.viewset
        try:
            queryset = viewset.queryset
        except AttributeError:
            # If there is no queryset in the viewset, then there is no model to use
            return None
        else:
            return queryset.model

    @classmethod
    def on_subclass_created(cls):
        """
        Register a router when a new RESTElement is created.
        """
        # Make sure that the class has the attribute viewset. Fail early in other respects
        if not isinstance(cls.viewset, type) or not issubclass(cls.viewset, ViewSetMixin):
            raise NotImplementedError(
                "{}.viewset is {}. It has to be a subclass of ViewSetMixin."
                .format(cls, cls.viewset))

        cls.register_router()

    @classmethod
    def get_collection_name(cls):
        """
        Returns the name of the collection.

        Returns the collection_name of model class attribute as default.
        """
        model = cls.get_model()
        try:
            collection_name = model.get_collection_name()
        except AttributeError:
            # This error is raised if the viewset has no model or if the model does
            # not have the method get_collection_name().
            if cls.router_prefix is None or cls.app_label is None:
                raise NotImplementedError(
                    "The used viewset does not use a RESTModelMixin as model. "
                    "You have to set the Attributes app_label and router_prefix.")
            collection_name = "{app_label}/{router_prefix}".format(
                app_label=cls.app_label,
                router_prefix=cls.router_prefix)
        return collection_name

    @classmethod
    def register_router(cls):
        """
        Register a django REST framework router for this REST element.
        """
        if cls.get_model() is None:
            router.register(cls.get_collection_name(), cls.viewset, cls.router_prefix)
        else:
            router.register(cls.get_collection_name(), cls.viewset)


def get_collection_and_id_from_url(url):
    """
    Helper function. Returns a tuple containing the collection name and the id
    extracted out of the given REST api URL.

    For example get_collection_and_id_from_url('http://localhost/api/users/user/3/')
    returns ('users/user', '3').

    Raises OpenSlidesError if the URL is invalid.
    """
    path = urlparse(url).path
    match = re.match(r'^/rest/(?P<collection>[-\w]+/[-\w]+)/(?P<id>[-\w]+)/$', path)
    if not match:
        raise OpenSlidesError('Invalid REST api URL: %s' % url)
    return match.group('collection'), match.group('id')
