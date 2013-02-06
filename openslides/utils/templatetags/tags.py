#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.templatetags.tags
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Template tags for OpenSlides

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import template
from openslides.config.models import config

register = template.Library()


@register.simple_tag
def get_min_supporters():
    return config['motion_min_supporters']


@register.simple_tag
def get_config(key):
    return config[key]


@register.simple_tag
def active(request, pattern):
    if request.path.startswith(pattern):
        return 'selected'
    return ''


@register.simple_tag
def model_url(object, link='view'):
    # TODO: Rename to object_url
    return object.get_absolute_url(link)


@register.filter
def first_line(text):
    try:
        lines = text.split('\n')
    except AttributeError:
        return ''
    if len(lines) > 1 or len(lines[0]) > 40:
        s = "%s ..."
    else:
        s = "%s"
    return s % lines[0][:40]
