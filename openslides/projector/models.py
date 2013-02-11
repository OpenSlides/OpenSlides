#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _, ugettext_noop

from openslides.config.signals import default_config_value

from openslides.projector.api import register_slidemodel
from openslides.projector.projector import SlideMixin


class ProjectorSlide(models.Model, SlideMixin):
    """
    Model for Slides, only for the projector. Also called custom slides.
    """
    prefix = 'ProjectorSlide'

    title = models.CharField(max_length=256, verbose_name=_("Title"))
    text = models.TextField(null=True, blank=True, verbose_name=_("Text"))
    weight = models.IntegerField(default=0, verbose_name=_("Weight"))

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


class ProjectorOverlay(models.Model):
    """
    Save information for a overlay.
    """
    active = models.BooleanField(verbose_name=_('Active'))
    def_name = models.CharField(max_length=64)
    sid = models.CharField(max_length=64, null=True, blank=True)

    def __unicode__(self):
        if self.sid:
            return "%s on %s" % (self.def_name, self.sid)
        return self.def_name


@receiver(default_config_value, dispatch_uid="projector_default_config")
def default_config(sender, key, **kwargs):
    return {
        'projector_message': '',
        'countdown_time': 60,
        'countdown_start_stamp': 0,
        'countdown_pause_stamp': 0,
        'countdown_state': 'inactive',
        'bigger': 100,
        'up': 0,
    }.get(key)
