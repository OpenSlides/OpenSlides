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
from time import time

from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.utils.translation import ugettext as _


from utils.views import TemplateView, RedirectView
from utils.utils import template, permission_required, \
                                   del_confirm_form, ajax_request
from utils.template import render_block_to_string
from utils.template import Tab

from system import config

from api import get_active_slide, set_active_slide
from projector import SLIDE
from models import ProjectorMessage
from openslides.projector.signals import projector_messages


class ControlView(TemplateView):
    template_name = 'projector/control.html'
    permission_required = 'projector.can_manage_projector'

    def get_context_data(self, **kwargs):
        context = super(ControlView, self).get_context_data(**kwargs)
        categories = {}
        for slide in SLIDE.values():
            if not categories.has_key(slide.category):
                categories[slide.category] = []
            categories[slide.category].append(slide)
        context.update({
            'categories': categories,
            'countdown_visible': config['countdown_visible'],
            'countdown_time': config['agenda_countdown_time'],
        })
        return context


class ActivateView(RedirectView):
    url = 'projector_control'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        set_active_slide(kwargs['sid'])

    def get_ajax_context(self, **kwargs):
        context = super(ActivateView, self).get_ajax_context()
        return context


@permission_required('projector.can_see_projector')
def active_slide(request):
    """
    Shows the active Slide.
    """
    try:
        data = get_active_slide()
    except AttributeError: #TODO: It has to be an Slide.DoesNotExist
        data = None

    if data is None:
        data = {
            'title': config['event_name'],
            'template': 'projector/default.html',
        }

    data['ajax'] = 'on'
    data['messages'] = []
    active_defs = ProjectorMessage.objects.filter(active=True).values_list('def_name', flat=True)
    for receiver, response in projector_messages.send(sender='active_slide', register=False, call=active_defs):
        if response is not None:
            data['messages'].append(response)


    if request.is_ajax():
        content = render_block_to_string(data['template'], 'content', data)
        jsondata = {
            'content': content,
            'messages': data['messages'],
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


class MessagesView(TemplateView):
    permission_required = 'projector.can_manage_projector'
    template_name = 'projector/messages.html'

    def get_projector_messages(self):
        messages = []
        for receiver, name in projector_messages.send(sender='registerer', register=True):
            if name is not None:
                try:
                    projector_message = ProjectorMessage.objects.get(def_name=name)
                except ProjectorMessage.DoesNotExist:
                    projector_message = ProjectorMessage(def_name=name, active=False)
                    projector_message.save()
                messages.append(projector_message)
        return messages

    def post(self, request, *args, **kwargs):
        for message in self.get_projector_messages():
            if message.def_name in request.POST:
                message.active = True
            else:
                message.active = False
            message.save()

        return self.get(request, *args, **kwargs)


    def get_context_data(self, **kwargs):
        context = super(MessagesView, self).get_context_data(**kwargs)
        context['projector_messages'] = self.get_projector_messages()
        return context


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
    return redirect(reverse('projector_control'))


@permission_required('projector.can_manage_projector')
def projector_countdown(request, command):
    #todo: why is there the time argument?
    if command == 'show':
        config['countdown_visible'] = True
    elif command == 'hide':
        config['countdown_visible'] = False
    elif command == 'reset':
        config['countdown_start'] = time()
    elif command == 'start':
        config['countdown_run'] = True
    elif command == 'stop':
        config['countdown_run'] = False

    if request.is_ajax():
        if command == "show":
            link = reverse('countdown_close')
        else:
            link = reverse('countdown_open')
        return ajax_request({'countdown_visible': config['countdown_visible'],
                             'link': link})
    return redirect(reverse('projector_control'))


def register_tab(request):
    selected = True if request.path.startswith('/projector/') else False
    return Tab(
        title=_('Projector'),
        url=reverse('projector_control'),
        permission=request.user.has_perm('projector.can_manag_projector'),
        selected=selected,
    )

