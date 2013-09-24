#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the projector app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy, ugettext_noop
from django.core.exceptions import ImproperlyConfigured
from django.core.urlresolvers import reverse

from openslides.utils.utils import int_or_none


class SlideMixin(object):
    """
    A Mixin for a Django-Model, for making the model a slide.
    """

    slide_callback_name = None
    """
    Name of the callback to render the model as slide.
    """

    def save(self, *args, **kwargs):
        """
        Updates the projector, if 'self' is the active slide.
        """
        from openslides.projector.api import update_projector
        super(SlideMixin, self).save(*args, **kwargs)
        if self.is_active_slide():
            update_projector()

    def delete(self, *args, **kwargs):
        from openslides.projector.api import update_projector
        super(SlideMixin, self).delete(*args, **kwargs)
        if self.is_active_slide():
            update_projector()

    def get_slide_callback_name(self):
        """
        Returns the name of the slide callback, which is used to render the slide.
        """
        if self.slide_callback_name is None:
            raise ImproperlyConfigured(
                "SlideMixin requires either a definition of 'slide_callback_name'"
                " or an implementation of 'get_slide_callback_name()'")
        else:
            return self.slide_callback_name

    def get_absolute_url(self, link='projector'):
        """
        Return the url to activate the slide, if link == 'projector'
        """
        if link == 'projector':
            url_name = 'projector_activate_slide'
        elif link == 'projector_preview':
            url_name = 'projector_preview'

        if link in ('projector', 'projector_preview'):
            return '%s?pk=%d' % (
                reverse(url_name,
                        args=[self.get_slide_callback_name()]),
                self.pk)
        return super(SlideMixin, self).get_absolute_url(link)

    def is_active_slide(self):
        """
        Return True, if the the slide is the active slide.
        """
        from openslides.projector.api import get_active_slide
        active_slide = get_active_slide()
        pk = int_or_none(active_slide.get('pk', None))

        return (active_slide['callback'] == self.get_slide_callback_name() and
                self.pk == pk)


class ProjectorSlide(SlideMixin, models.Model):
    """
    Model for Slides, only for the projector. Also called custom slides.
    """
    slide_callback_name = 'projector_slide'

    title = models.CharField(max_length=256, verbose_name=ugettext_lazy("Title"))
    text = models.TextField(null=True, blank=True, verbose_name=ugettext_lazy("Text"))
    weight = models.IntegerField(default=0, verbose_name=ugettext_lazy("Weight"))

    def get_absolute_url(self, link='update'):
        if link == 'edit' or link == 'update':
            return reverse('customslide_edit', args=[str(self.pk)])
        if link == 'delete':
            return reverse('customslide_delete', args=[str(self.pk)])
        return super(ProjectorSlide, self).get_absolute_url(link)

    def __unicode__(self):
        return self.title

    class Meta:
        permissions = (
            ('can_manage_projector', ugettext_noop("Can manage the projector")),
            ('can_see_projector', ugettext_noop("Can see the projector")),
            ('can_see_dashboard', ugettext_noop("Can see the dashboard")),
        )
