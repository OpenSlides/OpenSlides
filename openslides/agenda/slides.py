#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.slides
    ~~~~~~~~~~~~~~~~~~~~~~~

    Slides for the agenda app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.utils.translation import ugettext as _


def agenda_show():
    from openslides.agenda.models import Item
    data = {}
    items = Item.objects.filter(parent=None)
    data['title'] = _("Agenda")
    data['items'] = items
    data['template'] = 'projector/AgendaSummary.html'
    return data
