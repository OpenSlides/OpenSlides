#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from datetime import datetime
from time import time

from django.conf import settings
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.dispatch import receiver
from django.utils.datastructures import SortedDict
from django.utils.importlib import import_module
from django.utils.translation import ugettext_lazy as _

from openslides.utils.template import render_block_to_string, Tab
from openslides.utils.utils import html_strong
from openslides.utils.views import (TemplateView, RedirectView, CreateView,
    UpdateView, DeleteView, AjaxMixin)

from openslides.config.models import config

from openslides.projector.api import (get_active_slide, set_active_slide,
    projector_message_set, projector_message_delete, get_slide_from_sid)
from openslides.projector.models import ProjectorOverlay, ProjectorSlide
from openslides.projector.projector import SLIDE, Widget
from openslides.projector.signals import projector_overlays


class DashboardView(TemplateView, AjaxMixin):
    """
    Overview over all possible slides, the overlays and a liveview.
    """
    template_name = 'projector/dashboard.html'
    permission_required = 'projector.can_see_dashboard'

    def get_projector_overlays(self):
        overlays = []
        for receiver, name in projector_overlays.send(sender='registerer',
                                register=True):
            if name is not None:
                try:
                    projector_overlay = ProjectorOverlay.objects.get(
                        def_name=name)
                except ProjectorOverlay.DoesNotExist:
                    projector_overlay = ProjectorOverlay(def_name=name,
                        active=False)
                    projector_overlay.save()
                overlays.append(projector_overlay)
        return overlays

    def post(self, request, *args, **kwargs):
        if 'message' in request.POST:
            projector_message_set(request.POST['message_text'])
        elif 'message-clean' in request.POST:
            projector_message_delete()
        if request.is_ajax():
            return self.ajax_get(request, *args, **kwargs)
        return self.get(request, *args, **kwargs)

    def get_ajax_context(self, **kwargs):
        return {
            'overlay_message': config['projector_message'],
        }

    def get_context_data(self, **kwargs):
        context = super(DashboardView, self).get_context_data(**kwargs)

        widgets = SortedDict()
        for app in settings.INSTALLED_APPS:
            try:
                mod = import_module(app + '.views')
            except ImportError:
                continue
            appname = mod.__name__.split('.')[0]
            try:
                modul_widgets = mod.get_widgets(self.request)
            except AttributeError:
                continue

            for widget in modul_widgets:
                if self.request.user.has_perm(widget.permission_required):
                    widgets[widget.get_name()] = widget


        context.update({
            'countdown_time': config['countdown_time'],
            'countdown_state' : config['countdown_state'],
            'overlays': self.get_projector_overlays(),
            'widgets': widgets,
        })
        return context


class Projector(TemplateView, AjaxMixin):
    """
    The Projector-Page.
    """
    permission_required = 'projector.can_see_projector'

    @property
    def data(self):
        try:
            return self._data
        except AttributeError:
            pass
        sid = self.kwargs['sid']
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
        data['ajax'] = ajax

        # Projector Overlays
        if self.kwargs['sid'] is None:
            active_defs = ProjectorOverlay.objects.filter(active=True) \
                .filter(Q(sid=sid) | Q(sid=None)).values_list('def_name',
                flat=True)
            for receiver, response in projector_overlays.send(sender=sid,
                                        register=False, call=active_defs):
                if response is not None:
                    data['overlays'].append(response)
        self._data = data
        return data

    def get_template_names(self):
        return [self.data['template']]

    def get_context_data(self, **kwargs):
        context = super(Projector, self).get_context_data(**kwargs)
        context.update(self.data)
        return context

    def get_ajax_context(self, **kwargs):
        content = render_block_to_string(self.get_template_names()[0],
            'content', self.data)
        scrollcontent = render_block_to_string(self.get_template_names()[0],
            'scrollcontent', self.data)

        context = super(Projector, self).get_ajax_context(**kwargs)
        content_hash = hash(content)
        context.update({
            'content': content,
            'scrollcontent': scrollcontent,
            'time': datetime.now().strftime('%H:%M'),
            'overlays': self.data['overlays'],
            'title': self.data['title'],
            'bigger': config['bigger'],
            'up': config['up'],
            'content_hash': content_hash,
        })
        return context

    def get(self, request, *args, **kwargs):
        if request.is_ajax():
            return self.ajax_get(request, *args, **kwargs)
        return super(Projector, self).get(request, *args, **kwargs)


class ActivateView(RedirectView):
    """
    Activate a Slide.
    """
    permission_required = 'projector.can_manage_projector'
    url = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        try:
            set_active_slide(kwargs['sid'], kwargs['argument'])
        except KeyError:
            set_active_slide(kwargs['sid'])
        config['up'] = 0
        config['bigger'] = 100


class ProjectorEdit(RedirectView):
    """
    Scale or scroll the projector.
    """
    permission_required = 'projector.can_manage_projector'
    url = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        direction = kwargs['direction']
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


class CountdownEdit(RedirectView):
    """
    Start, stop or reset the countdown.
    """
    permission_required = 'projector.can_manage_projector'
    url = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        command = kwargs['command']
        # countdown_state is one of 'inactive', 'paused' and 'active', 'expired'
        if command in ['reset', 'start', 'stop']:
            config['countdown_time'] = config['countdown_time']

        if command == 'reset':
            config['countdown_start_stamp'] = time()
            config['countdown_pause_stamp'] = 0
            config['countdown_state'] = 'inactive'
        elif command == 'start':
            # if we had stopped the countdown resume were we left of
            if config['countdown_state'] == 'paused':
                start_stamp = config['countdown_start_stamp']
                pause_stamp = config['countdown_pause_stamp']
                now = time()
                config['countdown_start_stamp'] = now - \
                    (pause_stamp - start_stamp)
            else:
                config['countdown_start_stamp'] = time()

            config['countdown_state'] = 'active'
            config['countdown_pause_stamp'] = 0
        elif command == 'stop':
            if config['countdown_state'] == 'active':
                config['countdown_pause_stamp'] = time()
                config['countdown_state'] = 'paused'
        elif command == 'set-default':
            try:
                config['countdown_time'] = \
                    int(self.request.GET['countdown_time'])
            except ValueError:
                pass
            except AttributeError:
                pass

    def get_ajax_context(self, **kwargs):
        return {
            'state': config['countdown_state'],
            'countdown_time': config['countdown_time'],
        }


class ActivateOverlay(RedirectView):
    """
    Activate or deactivate an overlay.
    """
    url = 'dashboard'
    allow_ajax = True
    permission_required = 'projector.can_manage_projector'

    @property
    def overlay(self):
        try:
            return self._overlay
        except AttributeError:
            self._overlay = ProjectorOverlay.objects.get(
                def_name=self.kwargs['name'])
            return self._overlay

    def pre_redirect(self, request, *args, **kwargs):
        if kwargs['activate']:
            self.overlay.active = True
        else:
            self.overlay.active = False
        self.overlay.save()

    def get_ajax_context(self, **kwargs):
        return {
            'active': self.overlay.active,
            'def_name': self.overlay.def_name,
        }


class CustomSlideCreateView(CreateView):
    """
    Create a custom slide.
    """
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'projector/new.html'
    model = ProjectorSlide
    context_object_name = 'customslide'
    success_url = 'dashboard'
    apply_url = 'customslide_edit'


class CustomSlideUpdateView(UpdateView):
    """
    Update a custom slide.
    """
    permission_required = 'projector.can_manage_projector'
    template_name = 'projector/new.html'
    model = ProjectorSlide
    context_object_name = 'customslide'
    success_url = 'dashboard'
    apply_url = 'customslide_edit'


class CustomSlideDeleteView(DeleteView):
    """
    Delete a custom slide.
    """
    permission_required = 'projector.can_manage_projector'
    model = ProjectorSlide
    url = 'dashboard'


def register_tab(request):
    """
    Register the projector tab.
    """
    selected = True if request.path.startswith('/projector/') else False
    return Tab(
        title=_('Dashboard'),
        url=reverse('dashboard'),
        permission=request.user.has_perm('projector.can_manage_projector') or
            request.user.has_perm('projector.can_see_dashboard'),
        selected=selected,
    )


def get_widgets(request):
    """
    Return the custom slide widget.
    """
    return [
        Widget(
            name='projector',
            template='projector/widget.html',
            context={
                'slides': ProjectorSlide.objects.all(),
                'welcomepage_is_active': not bool(config["presentation"])},
            permission_required = 'projector.can_manage_projector',
        ),
    ]
