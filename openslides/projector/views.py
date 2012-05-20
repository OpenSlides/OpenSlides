#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from datetime import datetime
from time import time

from django.contrib import messages
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.utils.datastructures import SortedDict
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.db.models import Q


from utils.views import TemplateView, RedirectView, CreateView, UpdateView, DeleteView
from utils.utils import template, permission_required, \
                                   del_confirm_form, ajax_request
from utils.template import render_block_to_string
from utils.template import Tab

from config.models import config

from api import get_active_slide, set_active_slide, projector_message_set, projector_message_delete, get_slide_from_sid
from projector import SLIDE
from models import ProjectorOverlay, ProjectorSlide
from openslides.projector.signals import projector_overlays, projector_control_box
from openslides.utils.signals import template_manipulation

from django.utils.importlib import import_module
import settings


class ControlView(TemplateView):
    template_name = 'projector/control.html'
    permission_required = 'projector.can_manage_projector'

    def get_projector_overlays(self):
        overlays = []
        for receiver, name in projector_overlays.send(sender='registerer', register=True):
            if name is not None:
                try:
                    projector_overlay = ProjectorOverlay.objects.get(def_name=name)
                except ProjectorOverlay.DoesNotExist:
                    active = name == 'Message'
                    projector_overlay = ProjectorOverlay(def_name=name, active=active)
                    projector_overlay.save()
                overlays.append(projector_overlay)
        return overlays

    def post(self, request, *args, **kwargs):
        if 'message' in request.POST:
            projector_message_set(request.POST['message_text'])
        elif 'message-clean' in request.POST:
            projector_message_delete()
        else:
            for overlay in self.get_projector_overlays():
                if overlay.def_name in request.POST:
                    overlay.active = True
                else:
                    overlay.active = False
                overlay.save()
        return self.get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(ControlView, self).get_context_data(**kwargs)
        categories = {}
        for slide in SLIDE.values():
            if not categories.has_key(slide.category):
                categories[slide.category] = []
            categories[slide.category].append(slide)

        tmp_categories = categories
        categories = SortedDict()
        for app in settings.INSTALLED_APPS:
            if app in tmp_categories:
                tmp_categories[app].sort(key=lambda slide: slide.weight)
                categories[app] = tmp_categories[app]


        ## for receiver, response in projector_control_box.send(sender='ControllView'):
            ## if response is not None:
                ## categories[response[0]] = response[1]

        context.update({
            'categories': categories,
            'countdown_time': config['agenda_countdown_time'],
            'countdown_state' : config['countdown_state'],
            'overlays': self.get_projector_overlays(),
        })
        return context


class ActivateView(RedirectView):
    url = 'projector_control'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        set_active_slide(kwargs['sid'])

    def get_ajax_context(self, **kwargs):
        context = super(ActivateView, self).get_ajax_context()
        config['up'] = 0
        config['bigger'] = 100
        return context


class CustomSlideCreateView(CreateView):
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'projector/new.html'
    model = ProjectorSlide
    context_object_name = 'customslide'
    success_url = 'projector_control'
    apply_url = 'customslide_edit'

    def get_success_url(self):
        messages.success(self.request, _("Custom slide <b>%s</b> was successfully created.") % self.request.POST['title'])
        if 'apply' in self.request.POST:
            return reverse(self.get_apply_url(), args=[self.object.id])
        return reverse(super(CreateView, self).get_success_url())


class CustomSlideUpdateView(UpdateView):
    permission_required = 'projector.can_manage_projector'
    template_name = 'projector/new.html'
    model = ProjectorSlide
    context_object_name = 'customslide'
    success_url = 'projector_control'
    apply_url = 'customslide_edit'

    def get_success_url(self):
        messages.success(self.request, _("Custom slide <b>%s</b> was successfully modified.") % self.request.POST['title'])
        if 'apply' in self.request.POST:
            return ''
        return reverse(super(UpdateView, self).get_success_url())


class CustomSlideDeleteView(DeleteView):
    permission_required = 'projector.can_manage_projector'
    model = ProjectorSlide
    url = 'projector_control'

    def pre_post_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.delete()
        messages.success(request, _("Custom slide <b>%s</b> was successfully deleted.") % self.object)


@permission_required('projector.can_see_projector')
def active_slide(request, sid=None):
    """
    Shows the active Slide.
    """
    if sid is None:
        try:
            data = get_active_slide()
        except AttributeError: #TODO: It has to be an Slide.DoesNotExist
            data = None
        ajax = 'on'
    else:
        data = get_slide_from_sid(sid)
        ajax = 'off'

    if data is None:
        data = {
            'title': config['event_name'],
            'template': 'projector/default.html',
        }
    data['overlays'] = []
    data['overlay'] = ''
    data['ajax'] = ajax

    # Projector Overlays
    sid = get_active_slide(True)
    active_defs = ProjectorOverlay.objects.filter(active=True).filter(Q(sid=sid) | Q(sid=None)).values_list('def_name', flat=True)
    for receiver, response in projector_overlays.send(sender=sid, register=False, call=active_defs):
        if response is not None:
            data['overlays'].append(response)


    template_manipulation.send(sender='projector', request=request, context=data)
    if request.is_ajax():
        content = render_block_to_string(data['template'], 'content', data)
        scrollcontent = render_block_to_string(data['template'], 'scrollcontent', data)
        jsondata = {
            'content': content,
            'scrollcontent': scrollcontent,
            'overlays': data['overlays'],
            'title': data['title'],
            'time': datetime.now().strftime('%H:%M'),
            'bigger': config['bigger'],
            'up': config['up'],
            'overlay': data['overlay']
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
        config['bigger'] = int(config['bigger']) + 20
    elif direction == 'smaller':
        config['bigger'] = int(config['bigger']) - 20
    elif direction == 'up':
        config['up'] = int(config['up']) - 10
    elif direction == 'down':
        if config['up'] < 0:
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
    if command in ['reset','start','stop']:
        config['countdown_time'] = config['agenda_countdown_time']

    if command =='reset':
        if command == 'reset':
            config['countdown_start_stamp'] = time()
            config['countdown_pause_stamp'] = 0
            config['countdown_state'] = 'inactive'

    elif command == 'start':
            # if we had stopped the countdown resume were we left of
            if config['countdown_state'] == 'paused':
                s = config['countdown_start_stamp']
                p = config['countdown_pause_stamp']
                n = time()

                config['countdown_start_stamp'] = n - (p - s)
            else:
                config['countdown_start_stamp'] = time()

            config['countdown_state'] = 'active'
            config['countdown_pause_stamp'] = 0

    elif command == 'stop':
        if config['countdown_state'] == 'active':
            config['countdown_pause_stamp'] = time()
            config['countdown_state'] = 'paused'

    elif command == 'set_default':
        try:
            config['agenda_countdown_time'] = int(request.GET['countdown_time'])

        except ValueError:
            pass

        except AttributeError:
            pass

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
        permission=request.user.has_perm('projector.can_manage_projector'),
        selected=selected,
    )


## @receiver(projector_control_box, dispatch_uid="openslides.projector.views.projector_box")
## def projector_box(sender, **kwargs):
    ## return ('header', 'text')
