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
from django.utils.translation import ugettext as _
from openslides.config.api import config


register = template.Library()


@register.simple_tag
def get_config(key):
    return config[key]


@register.filter
def get_config(key):
    return config[key]


@register.filter
def trans(value):
    return _(value)


@register.simple_tag
def model_url(object, link='view'):
    # TODO: Rename to object_url
    try:
        return object.get_absolute_url(link)
    except ValueError:
        return ''


@register.filter
def first_line(text):
    try:
        lines = text.split('\n')
    except AttributeError:
        return ''
    if len(lines) > 1 or len(lines[0]) > 30:
        s = "%s ..."
    else:
        s = "%s"
    return s % lines[0][:30]
