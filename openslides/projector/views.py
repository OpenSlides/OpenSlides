#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the projector app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from datetime import datetime

from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.utils.translation import ugettext as _


from utils.utils import template, permission_required, \
                                   del_confirm_form, ajax_request
from utils.template import render_block_to_string

from system.api import config_set, config_get

from agenda.api import is_summary, children_list, \
                                  del_confirm_form_for_items
from agenda.models import Item

from projector.api import get_active_element, assignment_votes, assignment_polls


@permission_required('agenda.can_see_projector')
def active_slide(request):
    """
    Shows the active Slide.
    """
    try:
        element = get_active_element()
    except Item.DoesNotExist: #TODO: It has to be an Element.DoesNotExist
        element = None


    if element is None:
        data = {}
    else:
        data = element.slide()

    data['ajax'] = 'on'

    if element is None or (type(element) == Item and is_summary()):

        if element is None:
            items = Item.objects.filter(parent=None) \
                    .filter(hidden=False).order_by('weight')
            data['title'] = _("Agenda")
        else:
            items = element.children.filter(hidden=False)
            data['title'] = element.title
        data['items'] = items
        data['template'] = 'projector/AgendaSummary.html'


    if request.is_ajax():
        content = render_block_to_string(data['template'], 'content', data)
        jsondata = {
            'content': content,
            'title': data['title'],
            'time': datetime.now().strftime('%H:%M'),
            'bigger': config_get('bigger'),
            'up': config_get('up'),
            'countdown_visible': config_get('countdown_visible'),
            'countdown_time': config_get('agenda_countdown_time'),
            'countdown_control': config_get('countdown_control'),
        }
        return ajax_request(jsondata)
    else:
        return render_to_response(
            data['template'],
            data,
            context_instance=RequestContext(request)
        )


@permission_required('agenda.can_manage_agenda')
def projector_edit(request, direction):
    if direction == 'bigger':
        config_set('bigger', int(config_get('bigger', 100)) + 10)
    elif direction == 'smaller':
        config_set('bigger', int(config_get('bigger', 100)) - 10)
    elif direction == 'up':
        config_set('up', int(config_get('up', 0)) - 10)
    elif direction == 'down':
        config_set('up', int(config_get('up', 0)) + 10)
    elif direction == 'clean':
        config_set('up', 0)
        config_set('bigger', 100)

    if request.is_ajax():
        return ajax_request({})
    return redirect(reverse('item_overview'))


@permission_required('agenda.can_manage_agenda')
def projector_countdown(request, command, time=60):
    if command == 'show':
        config_set('countdown_visible', True)
    elif command == 'hide':
        config_set('countdown_visible', False)
    elif command == 'reset':
        config_set('countdown_control', 'reset')
    elif command == 'start':
        config_set('countdown_control', 'start')
    elif command == 'stop':
        config_set('countdown_control', 'stop')

    if request.is_ajax():
        if command == "show":
            link = reverse('countdown_close')
        else:
            link = reverse('countdown_open')
        return ajax_request({'countdown_visible': config_get('countdown_visible'),
                             'link': link})
    return redirect(reverse('item_overview'))
