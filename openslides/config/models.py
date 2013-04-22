#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the config app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django.utils.translation import ugettext_noop

from openslides.utils.jsonfield import JSONField


class ConfigStore(models.Model):
    """
    A model class to store all config variables in the database.
    """

    key = models.CharField(max_length=255, primary_key=True)
    """A string, the key of the config variable."""

    value = JSONField()
    """The value of the config variable. """

    class Meta:
        permissions = (('can_manage', ugettext_noop('Can manage configuration')),)
