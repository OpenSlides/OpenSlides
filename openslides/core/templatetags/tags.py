# -*- coding: utf-8 -*-

from django import template
from django.utils.translation import ugettext as _

from openslides.config.api import config

register = template.Library()


# TODO: remove the tag get_config
@register.simple_tag
def get_config(key):
    return config[key]


@register.filter  # noqa
def get_config(key):
    return config[key]


@register.filter
def trans(value):
    return _(value)


@register.filter
def absolute_url(model, link=None):
    """
    Returns the absolute_url to a model. The 'link' argument decides which url
    will be returned. See get_absolute_url() in the model.

    Example: {{ motion|absolute_url:'delete' }}
    """
    try:
        if link is None:
            url = model.get_absolute_url()
        else:
            url = model.get_absolute_url(link)
    except ValueError:
        url = ''
    return url


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
