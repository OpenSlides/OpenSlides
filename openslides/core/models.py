from django.core.urlresolvers import reverse
from django.db import models
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.utils.models import AbsoluteUrlMixin
from openslides.projector.models import SlideMixin


class CustomSlide(SlideMixin, AbsoluteUrlMixin, models.Model):
    """
    Model for Slides, only for the projector.
    """
    slide_callback_name = 'customslide'

    title = models.CharField(max_length=256, verbose_name=ugettext_lazy('Title'))
    text = models.TextField(null=True, blank=True, verbose_name=ugettext_lazy('Text'))
    weight = models.IntegerField(default=0, verbose_name=ugettext_lazy('Weight'))

    class Meta:
        """
        General permissions that can not be placed at a specific app.
        """
        permissions = (
            ('can_manage_projector', ugettext_noop('Can manage the projector')),
            ('can_see_projector', ugettext_noop('Can see the projector')),
            ('can_see_dashboard', ugettext_noop('Can see the dashboard')),
            ('can_use_chat', ugettext_noop('Can use the chat')),
        )

    def __unicode__(self):
        return self.title

    def get_absolute_url(self, link='update'):
        if link == 'update':
            url = reverse('customslide_update', args=[str(self.pk)])
        elif link == 'delete':
            url = reverse('customslide_delete', args=[str(self.pk)])
        else:
            url = super(CustomSlide, self).get_absolute_url(link)
        return url


class Tag(AbsoluteUrlMixin, models.Model):
    """
    Model to save tags.
    """

    name = models.CharField(max_length=255, unique=True,
                            verbose_name=ugettext_lazy('Tag'))

    class Meta:
        ordering = ['name']
        permissions = (
            ('can_manage_tags', ugettext_noop('Can manage tags')), )

    def __unicode__(self):
        return self.name
