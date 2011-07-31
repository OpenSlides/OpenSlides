#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.system.api
    ~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the system app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from system.models import Config, DEFAULT_DATA

def config_get(key, default=None):
    """
    return the Value to the given Key
    Else, return the given default value
    Else, return the default value from config.models
    Else, return none
    """

    try:
        value = Config.objects.values_list('value').get(pk=key)[0]
        return value
    except Config.DoesNotExist:
        if default is None:
            try:
                default = DEFAULT_DATA[key]
            except KeyError:
                pass
        return default

def config_set(key, value):
    """
    Save key, value in DB. If it allready exist, it will be updated
    """
    try:
        c = Config.objects.get(id=key)
    except Config.DoesNotExist:
        c = Config()
        c.id = str(key)

    c.value = unicode(value)
    c.save()
