#!/usr/bin/env python
# -*- coding: utf-8 -*-

from django import template
from django.db import connection

register = template.Library()

@register.simple_tag
def queries():
    out = ''
    for q in connection.queries:
        out += "<tr><td>%s</td><td>%s</td></tr>" % ( q['time'], q['sql'])
    return out
