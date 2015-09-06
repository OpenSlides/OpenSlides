from django.db import models
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop
from jsonfield import JSONField

from openslides.utils.models import RESTModelMixin
from openslides.utils.projector import ProjectorElement

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
            "id": 1},
        "191c0878cdc04abfbd64f3177a21891a": {
            "name": "core/countdown",
            "stable": true,
            "countdown_time": 20,
            "status": "stop"},
        "db670aa8d3ed4aabb348e752c75aeaaf": {
            "name": "core/clock",
            "stable": true}
    }

    If the config field is empty or invalid the projector shows a default
    slide.

    The projector can be controlled using the REST API with POST requests
    on e. g. the URL /rest/core/projector/1/activate_elements/.
    """
    config = JSONField()

    class Meta:
        """
        Contains general permissions that can not be placed in a specific app.
        """
        permissions = (
            ('can_see_projector', ugettext_noop('Can see the projector')),
            ('can_manage_projector', ugettext_noop('Can manage the projector')),
            ('can_see_dashboard', ugettext_noop('Can see the dashboard')),
            ('can_use_chat', ugettext_noop('Can use the chat')))

    @property
    def elements(self):
        """
        Retrieve all projector elements given in the config
        field. For every element the method get_data() is called and its
        result is also used.
        """
        # Get all elements from all apps.
        elements = {}
        for element in ProjectorElement.get_all():
            elements[element.name] = element

        # Parse result
        result = {}
        for key, value in self.config.items():
            result[key] = value
            element = elements.get(value['name'])
            if element is None:
                result[key]['error'] = _('Projector element does not exist.')
            else:
                try:
                    result[key].update(element.get_data(
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
    title = models.CharField(
        verbose_name=ugettext_lazy('Title'),
        max_length=256)
    text = models.TextField(
        verbose_name=ugettext_lazy('Text'),
        blank=True)
    weight = models.IntegerField(
        verbose_name=ugettext_lazy('Weight'),
        default=0)

    class Meta:
        ordering = ('weight', 'title', )

    def __str__(self):
        return self.title


class Tag(RESTModelMixin, models.Model):
    """
    Model for tags. This tags can be used for other models like agenda items,
    motions or assignments.
    """
    name = models.CharField(
        verbose_name=ugettext_lazy('Tag'),
        max_length=255,
        unique=True)

    class Meta:
        ordering = ('name',)
        permissions = (
            ('can_manage_tags', ugettext_noop('Can manage tags')), )

    def __str__(self):
        return self.name


class ConfigStore(models.Model):
    """
    A model class to store all config variables in the database.
    """

    key = models.CharField(max_length=255, unique=True, db_index=True)
    """A string, the key of the config variable."""

    value = JSONField()
    """The value of the config variable. """

    class Meta:
        permissions = (('can_manage_config', ugettext_noop('Can manage configuration')),)
