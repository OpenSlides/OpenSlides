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

from openslides.projector.api import register_slidemodel
from openslides.projector.projector import SlideMixin


class ProjectorSlide(models.Model, SlideMixin):
    """
    Model for Slides, only for the projector. Also called custom slides.
    """
    prefix = 'ProjectorSlide'

    title = models.CharField(max_length=256, verbose_name=ugettext_lazy("Title"))
    text = models.TextField(null=True, blank=True, verbose_name=ugettext_lazy("Text"))
    weight = models.IntegerField(default=0, verbose_name=ugettext_lazy("Weight"))

    def slide(self):
        return {
            'slide': self,
            'title': self.title,
            'template': 'projector/ProjectorSlide.html',
        }

    @models.permalink
    def get_absolute_url(self, link='edit'):
        if link == 'edit':
            return ('customslide_edit', [str(self.id)])
        if link == 'delete':
            return ('customslide_delete', [str(self.id)])

    def __unicode__(self):
        return self.title

    class Meta:
        permissions = (
            ('can_manage_projector', ugettext_noop("Can manage the projector")),
            ('can_see_projector', ugettext_noop("Can see the projector")),
            ('can_see_dashboard', ugettext_noop("Can see the dashboard")),
        )


register_slidemodel(ProjectorSlide, control_template='projector/control_customslide.html')
