from django.conf import settings
from django.db import models
from django.utils.timezone import now
from jsonfield import JSONField

from ..utils.collection import CollectionElement
from ..utils.models import RESTModelMixin
from ..utils.projector import ProjectorElement
from .access_permissions import (
    ChatMessageAccessPermissions,
    ConfigAccessPermissions,
    CountdownAccessPermissions,
    ProjectorAccessPermissions,
    ProjectorMessageAccessPermissions,
    TagAccessPermissions,
)
from .exceptions import ProjectorException


class ProjectorManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all projectors. In the background
        projector defaults are prefetched from the database.
        """
        return self.get_queryset().prefetch_related(
            'projectiondefaults')


class Projector(RESTModelMixin, models.Model):
    """
    Model for all projectors.

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

    objects = ProjectorManager()

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

    def get_all_requirements(self):
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

    def get_collection_elements_required_for_this(self, collection_element):
        """
        Returns an iterable of CollectionElements that have to be sent to this
        projector according to the given collection_element.
        """
        from .config import config

        output = []
        changed_fields = collection_element.information.get('changed_fields', [])

        if (collection_element.collection_string == self.get_collection_string() and
                changed_fields and
                'config' not in changed_fields):
            # Projector model changed without changeing the projector config. So we just send this data.
            output.append(collection_element)
        else:
            # It is necessary to parse all active projector elements to check whether they require some data.
            this_projector = collection_element.collection_string == self.get_collection_string() and collection_element.id == self.pk
            collection_element.information['this_projector'] = this_projector
            elements = {}

            # Build projector elements.
            for element in ProjectorElement.get_all():
                elements[element.name] = element

            # Iterate over all active projector elements.
            for key, value in self.config.items():
                element = elements.get(value['name'])
                if element is not None:
                    if collection_element.information.get('changed_config') == 'projector_broadcast':
                        # In case of broadcast we need full update.
                        output.extend(element.get_requirements_as_collection_elements(value))
                    else:
                        # In normal case we need all collections required by the element.
                        output.extend(element.get_collection_elements_required_for_this(collection_element, value))

            # If config changed, send also this config to the projector.
            if collection_element.collection_string == config.get_collection_string():
                output.append(collection_element)
                if collection_element.information.get('changed_config') == 'projector_broadcast':
                    # In case of broadcast we also need the projector himself.
                    output.append(CollectionElement.from_instance(self))

        return output


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
            ('can_use_chat', 'Can use the chat'),
            ('can_manage_chat', 'Can manage the chat'),)

    def __str__(self):
        return 'Message {}'.format(self.timestamp)


class ProjectorMessage(RESTModelMixin, models.Model):
    """
    Model for ProjectorMessages.
    """
    access_permissions = ProjectorMessageAccessPermissions()

    message = models.TextField(blank=True)

    class Meta:
        default_permissions = ()


class Countdown(RESTModelMixin, models.Model):
    """
    Model for countdowns.
    """
    access_permissions = CountdownAccessPermissions()

    description = models.CharField(max_length=256, blank=True)

    running = models.BooleanField(default=False)

    default_time = models.PositiveIntegerField(default=60)

    countdown_time = models.FloatField(default=60)

    class Meta:
        default_permissions = ()

    def control(self, action):
        if action not in ('start', 'stop', 'reset'):
            raise ValueError("Action must be 'start', 'stop' or 'reset', not {}.".format(action))

        if action == 'start':
            self.running = True
            self.countdown_time = now().timestamp() + self.default_time
        elif action == 'stop' and self.running:
            self.running = False
            self.countdown_time = self.countdown_time - now().timestamp()
        else:  # reset
            self.running = False
            self.countdown_time = self.default_time
        self.save()
