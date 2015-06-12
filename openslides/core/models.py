from django.db import models
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop
from jsonfield import JSONField

from openslides.utils.models import AbsoluteUrlMixin
from openslides.utils.projector import ProjectorElement
from openslides.utils.rest_api import RESTModelMixin

from .exceptions import ProjectorException


class Projector(RESTModelMixin, models.Model):
    """
    Model for all projectors. At the moment we support only one projector,
    the default projector (pk=1).

    If the config field is empty or invalid the projector shows a default
    slide. To activate a slide and extra projector elements, save valid
    JSON to the config field.

    Example: [{"name": "core/customslide", "id": 2},
              {"name": "core/countdown", "countdown_time": 20, "status": "stop"},
              {"name": "core/clock", "stable": true}]

    This can be done using the REST API with POST requests on e. g. the URL
    /rest/core/projector/1/activate_projector_elements/. The data have to be
    a list of dictionaries. Every dictionary must have at least the
    property "name". The property "stable" is to set whether this element
    should disappear on prune or clear requests.
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
    def projector_elements(self):
        """
        A generator to retrieve all projector elements given in the config
        field. For every element the method get_data() is called and its
        result returned.
        """
        elements = {}
        for element in ProjectorElement.get_all():
            elements[element.name] = element
        for config_entry in self.config:
            name = config_entry['name']
            element = elements.get(name)
            data = {'name': name}
            if element is None:
                data['error'] = _('Projector element does not exist.')
            else:
                try:
                    data.update(element.get_data(
                        projector_object=self,
                        config_entry=config_entry))
                except ProjectorException as e:
                    data['error'] = str(e)
            yield data

    @classmethod
    def get_all_requirements(cls):
        """
        Generator which returns all ProjectorRequirement instances of all
        active projector elements.
        """
        elements = {}
        for element in ProjectorElement.get_all():
            elements[element.name] = element
        for projector in cls.objects.all():
            for config_entry in projector.config:
                element = elements.get(config_entry['name'])
                if element is not None:
                    for requirement in element.get_requirements(config_entry):
                        yield requirement


class CustomSlide(RESTModelMixin, AbsoluteUrlMixin, models.Model):
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


class Tag(RESTModelMixin, AbsoluteUrlMixin, models.Model):
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
