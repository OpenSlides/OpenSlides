#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.beamer.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the beamer app.

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

from agenda.api import get_active_item, is_summary, children_list, \
                                  del_confirm_form_for_items
from agenda.models import Item


@permission_required('agenda.can_see_projector')
def beamer(request):
    """
    Shows a active Slide.
    """
    data = {'ajax': 'on'}
    template = ''
    try:
        item = get_active_item()
        votes = assignment_votes(item)
        polls = assignment_polls(item)
        if is_summary():
            items = item.children.filter(hidden=False)
            data['items'] = items
            data['title'] = item.title
            template = 'beamer/overview.html'
        else:
            data['item'] = item.cast()
            data['title'] = item.title
            data['votes'] = votes
            data['polls'] = polls
            template = 'beamer/%s.html' % (item.type)
    except Item.DoesNotExist:
        items = Item.objects.filter(parent=None).filter(hidden=False) \
                            .order_by('weight')
        data['items'] = items
        data['title'] = _("Agenda")
        template = 'beamer/overview.html'

    if request.is_ajax():
        content = render_block_to_string(template, 'content', data)
        jsondata = {'content': content,
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
        return render_to_response(template,
                                  data,
                                  context_instance=RequestContext(request))


@permission_required('agenda.can_manage_agenda')
def beamer_edit(request, direction):
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
def beamer_countdown(request, command, time=60):
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
