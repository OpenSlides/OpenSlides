#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.system.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the system app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django.utils.translation import ugettext as _

DEFAULT_DATA  = {
    'event_name': 'OpenSlides',
    'event_description': 'Presentation and voting system',
    'agenda_countdown_time': 60,
    'application_min_supporters': 4,
    'application_preamble': 'Die Versammlung möge beschließen,',
    'application_pdf_title': _('Applications'),
    'assignment_pdf_title': _('Elections'),
    'system_url': 'http://127.0.0.1:8000',
    'system_welcometext': 'Welcome to OpenSlides!',
}

class Config(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    value = models.CharField(max_length=100)

    def __unicode__(self):
        return self.id

    class Meta:
        permissions = (
            ('can_manage_system', "Can manage system configuration"),
        )
