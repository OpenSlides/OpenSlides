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

from openslides.projector.api import register_slidemodel, register_slidefunc

from .models import Item


def agenda_show():
    data = {}
    items = Item.objects.filter(parent=None, type__exact=Item.AGENDA_ITEM)
    data['title'] = _("Agenda")
    data['items'] = items
    data['template'] = 'projector/AgendaSummary.html'
    return data

register_slidemodel(Item, control_template='agenda/control_item.html')
register_slidefunc('agenda', agenda_show, weight=-1, name=_('Agenda'))
