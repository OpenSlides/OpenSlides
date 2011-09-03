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

DEFAULT_DATA  = {
    'event_name': 'OpenSlides',
    'event_description': 'Presentation and voting system',
    'application_min_supporters': 4,
    'application_preamble': 'Die Versammlung möge beschließen,',
    'sysem_url': 'http://openslides:8000',
}

class Config(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    value = models.CharField(max_length=100)

    def __unicode__(self):
        return self.id

    class Meta:
        permissions = (
            ('can_manage_system', "Can manage the system"),
        )
