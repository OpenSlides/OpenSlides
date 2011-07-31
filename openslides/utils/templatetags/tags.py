#!/usr/bin/env python
# -*- coding: utf-8 -*-

from django import template
from system.api import config_get

register = template.Library()

@register.simple_tag
def get_min_supporters():
    return config_get('application_min_supporters')

@register.simple_tag
def get_config(key):
    return config_get(key)

@register.simple_tag
def active(request, pattern):
    if request.path.startswith(pattern):
        return 'selected'
    return ''
