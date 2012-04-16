#!/usr/bin/env python
# -*- coding: utf-8 -*-

from django import template
from config.models import config

register = template.Library()

@register.simple_tag
def get_min_supporters():
    return config['application_min_supporters']


@register.simple_tag
def get_config(key):
    return config[key]


@register.simple_tag
def active(request, pattern):
    if request.path.startswith(pattern):
        return 'selected'
    return ''
