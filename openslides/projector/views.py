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

from system import config

from projector.api import get_active_slide


@permission_required('agenda.can_see_projector')
def active_slide(request):
    """
    Shows the active Slide.
    """
    try:
        data = get_active_slide()
    except AttributeError: #TODO: It has to be an Slide.DoesNotExist
        data = {
            'title': config['event_name'],
            'template': 'projector/default.html',
        }

    data['ajax'] = 'on'

    if request.is_ajax():
        content = render_block_to_string(data['template'], 'content', data)
        jsondata = {
            'content': content,
            'title': data['title'],
            'time': datetime.now().strftime('%H:%M'),
            'bigger': config['bigger'],
            'up': config['up'],
            'countdown_visible': config['countdown_visible'],
            'countdown_time': config['agenda_countdown_time'],
            'countdown_control': config['countdown_control'],
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
        config['bigger'] = int(config['bigger']) + 10
    elif direction == 'smaller':
        config['bigger'] = int(config['bigger']) - 10
    elif direction == 'up':
        config['up'] = int(config['up']) - 10
    elif direction == 'down':
        config['up'] = int(config['up']) + 10
    elif direction == 'clean':
        config['up'] = 0
        config['bigger'] = 100

    if request.is_ajax():
        return ajax_request({})
    return redirect(reverse('item_overview'))


@permission_required('agenda.can_manage_agenda')
def projector_countdown(request, command, time=60):
    if command == 'show':
        config['countdown_visible'] = True
    elif command == 'hide':
        config['countdown_visible'] = False
    elif command == 'reset':
        config['countdown_control'] = 'reset'
    elif command == 'start':
        config['countdown_control'] = 'start'
    elif command == 'stop':
        config['countdown_control'] = 'stop'

    if request.is_ajax():
        if command == "show":
            link = reverse('countdown_close')
        else:
            link = reverse('countdown_open')
        return ajax_request({'countdown_visible': config['countdown_visible'],
                             'link': link})
    return redirect(reverse('item_overview'))
