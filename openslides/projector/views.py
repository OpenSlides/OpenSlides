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
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.utils.datastructures import SortedDict
from django.utils.importlib import import_module
from django.dispatch import receiver
from django.db.models import Q
from django.conf import settings

from openslides.utils.views import (TemplateView, RedirectView, CreateView,
    UpdateView, DeleteView, AjaxMixin)
from openslides.utils.template import render_block_to_string, Tab

from openslides.config.models import config

from openslides.projector.api import (get_active_slide, set_active_slide,
    projector_message_set, projector_message_delete, get_slide_from_sid)
from openslides.projector.projector import SLIDE, Widget
from openslides.projector.models import ProjectorOverlay, ProjectorSlide
from openslides.projector.signals import projector_overlays


class ControlView(TemplateView, AjaxMixin):
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
        if request.is_ajax():
            return self.ajax_get(request, *args, **kwargs)
        return self.get(request, *args, **kwargs)

    def get_ajax_context(self, **kwargs):
        return {
            'overlay_message': config['projector_message'],
        }

    def get_context_data(self, **kwargs):
        context = super(ControlView, self).get_context_data(**kwargs)

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
                widgets[widget.get_name()] = widget


        context.update({
            'countdown_time': config['countdown_time'],
            'countdown_state' : config['countdown_state'],
            'overlays': self.get_projector_overlays(),
            'widgets': widgets,
        })
        return context


class ActivateOverlay(RedirectView):
    url = 'projector_control'
    allow_ajax = True

    @property
    def overlay(self):
        try:
            return self._overlay
        except AttributeError:
            self._overlay = ProjectorOverlay.objects.get(def_name=self.kwargs['name'])
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


class ActivateView(RedirectView):
    url = 'projector_control'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        try:
            set_active_slide(kwargs['sid'], kwargs['argument'])
        except KeyError:
            set_active_slide(kwargs['sid'])
        config['up'] = 0
        config['bigger'] = 100


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


class Projector(TemplateView, AjaxMixin):
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
            active_defs = ProjectorOverlay.objects.filter(active=True).filter(Q(sid=sid) | Q(sid=None)).values_list('def_name', flat=True)
            for receiver, response in projector_overlays.send(sender=sid, register=False, call=active_defs):
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
        content = render_block_to_string(self.get_template_names()[0], 'content', self.data)
        scrollcontent = render_block_to_string(self.get_template_names()[0], 'scrollcontent', self.data)

        context = super(Projector, self).get_ajax_context(**kwargs)
        context.update({
            'content': content,
            'scrollcontent': scrollcontent,
            'time': datetime.now().strftime('%H:%M'),
            'overlays': self.data['overlays'],
            'title': self.data['title'],
            'bigger': config['bigger'],
            'up': config['up'],
        })
        return context

    def get(self, request, *args, **kwargs):
        if request.is_ajax():
            return self.ajax_get(request, *args, **kwargs)
        return super(Projector, self).get(request, *args, **kwargs)



class ProjectorEdit(RedirectView):
    permission_required = 'projector.can_manage_projector'
    url = 'projector_control'
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
    permission_required = 'projector.can_manage_projector'
    url = 'projector_control'
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

                config['countdown_start_stamp'] = now - (pause_stamp - start_stamp)
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
                config['countdown_time'] = int(self.request.GET['countdown_time'])
            except ValueError:
                pass
            except AttributeError:
                pass

    def get_ajax_context(self, **kwargs):
        return {
            'state': config['countdown_state'],
            'countdown_time': config['countdown_time'],
        }


def register_tab(request):
    selected = True if request.path.startswith('/projector/') else False
    return Tab(
        title=_('Projector'),
        url=reverse('projector_control'),
        permission=request.user.has_perm('projector.can_manage_projector'),
        selected=selected,
    )


def get_widgets(request):
    return [
        Widget(
            name='projector',
            template='projector/widget.html',
            context={
                'slides': ProjectorSlide.objects.all(),
            }
        ),
    ]
