from django.conf import settings
from django.contrib.sessions.models import Session as DjangoSession
from django.db import models
from jsonfield import JSONField

from openslides.utils.models import RESTModelMixin
from openslides.utils.projector import ProjectorElement

from .access_permissions import (
    ChatMessageAccessPermissions,
    ConfigAccessPermissions,
    ProjectorAccessPermissions,
    TagAccessPermissions,
)
from .exceptions import ProjectorException


class Projector(RESTModelMixin, models.Model):
    """
    Model for all projectors. At the moment we support only one projector,
    the default projector (pk=1).

    The config field contains a dictionary which uses UUIDs as keys. Every
    element must have at least the property "name". The property "stable"
    is to set whether this element should disappear on prune or clear
    requests.

    Example:

    {
        "881d875cf01741718ca926279ac9c99c": {
            "name": "topics/topic",
            "id": 1
        },
        "191c0878cdc04abfbd64f3177a21891a": {
            "name": "core/countdown",
            "stable": true,
            "status": "stop",
            "countdown_time": 20,
            "visable": true,
            "default": 42
        },
        "db670aa8d3ed4aabb348e752c75aeaaf": {
            "name": "core/clock",
            "stable": true
        }
    }

    If the config field is empty or invalid the projector shows a default
    slide.

    There are two additional fields to control the behavior of the projector
    view itself: scale and scroll.

    The projector can be controlled using the REST API with POST requests
    on e. g. the URL /rest/core/projector/1/activate_elements/.
    """
    access_permissions = ProjectorAccessPermissions()

    config = JSONField()

    scale = models.IntegerField(default=0)

    scroll = models.IntegerField(default=0)

    width = models.PositiveIntegerField(default=1024)

    height = models.PositiveIntegerField(default=768)

    name = models.CharField(
        max_length=255,
        unique=True,
        blank=True)

    blank = models.BooleanField(
        blank=False,
        default=False)

    class Meta:
        """
        Contains general permissions that can not be placed in a specific app.
        """
        default_permissions = ()
        permissions = (
            ('can_see_projector', 'Can see the projector'),
            ('can_manage_projector', 'Can manage the projector'),
            ('can_see_frontpage', 'Can see the front page'),)

    @property
    def elements(self):
        """
        Retrieve all projector elements given in the config field. For
        every element the method check_and_update_data() is called and its
        result is also used.
        """
        # Get all elements from all apps.
        elements = {}
        for element in ProjectorElement.get_all():
            elements[element.name] = element

        # Parse result
        result = {}
        for key, value in self.config.items():
            # Use a copy here not to change the origin value in the config field.
            result[key] = value.copy()
            result[key]['uuid'] = key
            element = elements.get(value['name'])
            if element is None:
                result[key]['error'] = 'Projector element does not exist.'
            else:
                try:
                    result[key].update(element.check_and_update_data(
                        projector_object=self,
                        config_entry=value))
                except ProjectorException as e:
                    result[key]['error'] = str(e)
        return result

    def get_all_requirements(self, on_slide=None):  #TODO: Refactor or rename this.
        """
        Generator which returns all instances that are shown on this projector.
        """
        # Get all elements from all apps.
        elements = {}
        for element in ProjectorElement.get_all():
            elements[element.name] = element

        # Generator
        for key, value in self.config.items():
            element = elements.get(value['name'])
            if element is not None:
                yield from element.get_requirements(value)

    def collection_element_is_shown(self, collection_element):
        """
        Returns True if this collection element is shown on this projector.
        """
        for requirement in self.get_all_requirements():
            if (requirement.get_collection_string() == collection_element.collection_string and
                    requirement.pk == collection_element.id):
                result = True
                break
        else:
            result = False
        return result

    @classmethod
    def get_projectors_that_show_this(cls, collection_element):
        """
        Returns a list of the projectors that show this collection element.
        """
        result = []
        for projector in cls.objects.all():
            if projector.collection_element_is_shown(collection_element):
                result.append(projector)
        return result

    def need_full_update_for_this(self, collection_element):
        """
        Returns True if this projector needs to be updated with all
        instances as defined in get_all_requirements() because one active
        projector element requires this.
        """
        # Get all elements from all apps.
        elements = {}
        for element in ProjectorElement.get_all():
            elements[element.name] = element

        for key, value in self.config.items():
            element = elements.get(value['name'])
            if element is not None and element.need_full_update_for_this(collection_element):
                result = True
                break
        else:
            result = False

        return result


class ProjectionDefault(RESTModelMixin, models.Model):
    """
    Model for the projection defaults like motions, agenda, list of
    speakers and thelike. The name is the technical name like 'topics' or
    'motions'. For apps the name should be the app name to get keep the
    ProjectionDefault for apps generic. But it is possible to give some
    special name like 'list_of_speakers'. The display_name is the shown
    name on the front end for the user.
    """
    name = models.CharField(max_length=256)

    display_name = models.CharField(max_length=256)

    projector = models.ForeignKey(
        Projector,
        on_delete=models.CASCADE,
        related_name='projectiondefaults')

    def get_root_rest_element(self):
        return self.projector

    class Meta:
        default_permissions = ()

    def __str__(self):
        return self.display_name


class Tag(RESTModelMixin, models.Model):
    """
    Model for tags. This tags can be used for other models like agenda items,
    motions or assignments.
    """
    access_permissions = TagAccessPermissions()

    name = models.CharField(
        max_length=255,
        unique=True)

    class Meta:
        ordering = ('name',)
        default_permissions = ()
        permissions = (
            ('can_manage_tags', 'Can manage tags'),)

    def __str__(self):
        return self.name


class ConfigStore(RESTModelMixin, models.Model):
    """
    A model class to store all config variables in the database.
    """
    access_permissions = ConfigAccessPermissions()

    key = models.CharField(max_length=255, unique=True, db_index=True)
    """A string, the key of the config variable."""

    value = JSONField()
    """The value of the config variable. """

    class Meta:
        default_permissions = ()
        permissions = (
            ('can_manage_config', 'Can manage configuration'),)

    @classmethod
    def get_collection_string(cls):
        return 'core/config'

    def get_rest_pk(self):
        """
        Returns the primary key used in the REST API.
        """
        return self.key


class ChatMessage(RESTModelMixin, models.Model):
    """
    Model for chat messages.

    At the moment we only have one global chat room for managers.
    """
    access_permissions = ChatMessageAccessPermissions()

    message = models.TextField()

    timestamp = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE)

    class Meta:
        default_permissions = ()
        permissions = (
            ('can_use_chat', 'Can use the chat'),)

    def __str__(self):
        return 'Message {}'.format(self.timestamp)


class Session(DjangoSession):
    """
    Model like the Django db session, which saves the user as ForeignKey instead
    of an encoded value.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True)

    class Meta:
        default_permissions = ()

    @classmethod
    def get_session_store_class(cls):
        from .session_backend import SessionStore
        return SessionStore
