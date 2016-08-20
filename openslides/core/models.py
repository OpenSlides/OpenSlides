from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import models
from jsonfield import JSONField

from openslides.mediafiles.models import Mediafile
from openslides.utils.models import RESTModelMixin
from openslides.utils.projector import ProjectorElement

from .access_permissions import (
    ChatMessageAccessPermissions,
    ConfigAccessPermissions,
    CustomSlideAccessPermissions,
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
            "name": "core/customslide",
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

    @classmethod
    def get_all_requirements(cls):
        """
        Generator which returns all ProjectorRequirement instances of all
        active projector elements.
        """
        # Get all elements from all apps.
        elements = {}
        for element in ProjectorElement.get_all():
            elements[element.name] = element

        # Generator
        for projector in cls.objects.all():
            for key, value in projector.config.items():
                element = elements.get(value['name'])
                if element is not None:
                    for requirement in element.get_requirements(value):
                        yield requirement


class CustomSlide(RESTModelMixin, models.Model):
    """
    Model for slides with custom content.
    """
    access_permissions = CustomSlideAccessPermissions()

    title = models.CharField(
        max_length=256)
    text = models.TextField(
        blank=True)
    weight = models.IntegerField(
        default=0)
    attachments = models.ManyToManyField(
        Mediafile,
        blank=True)

    class Meta:
        default_permissions = ()
        ordering = ('weight', 'title', )

    def __str__(self):
        return self.title

    @property
    def agenda_item(self):
        """
        Returns the related agenda item.
        """
        # TODO: Move the agenda app in the core app to fix circular dependencies
        from openslides.agenda.models import Item
        content_type = ContentType.objects.get_for_model(self)
        return Item.objects.get(object_id=self.pk, content_type=content_type)

    @property
    def agenda_item_id(self):
        """
        Returns the id of the agenda item object related to this object.
        """
        return self.agenda_item.pk

    def get_agenda_title(self):
        return self.title

    def get_agenda_list_view_title(self):
        return self.title

    def get_search_index_string(self):
        """
        Returns a string that can be indexed for the search.
        """
        return " ".join((
            self.title,
            self.text))


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
