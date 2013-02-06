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

from django.contrib import messages
from django.core.cache import cache
from django.core.context_processors import csrf
from django.core.urlresolvers import reverse
from django.db import transaction
from django.db.models import Q
from django.shortcuts import redirect
from django.template import RequestContext
from django.utils.translation import ugettext_lazy as _

from openslides.utils.template import render_block_to_string, Tab
from openslides.utils.views import (
    TemplateView, RedirectView, CreateView, UpdateView, DeleteView, AjaxMixin)
from openslides.config.models import config
from .api import (
    get_active_slide, set_active_slide, projector_message_set,
    projector_message_delete, get_slide_from_sid, get_all_widgets,
    clear_projector_cache)
from .forms import SelectWidgetsForm
from .models import ProjectorOverlay, ProjectorSlide
from .projector import Widget
from .signals import projector_overlays


class DashboardView(TemplateView, AjaxMixin):
    """
    Overview over all possible slides, the overlays and a liveview.
    """
    template_name = 'projector/dashboard.html'
    permission_required = 'projector.can_see_dashboard'

    def get_context_data(self, **kwargs):
        context = super(DashboardView, self).get_context_data(**kwargs)

        context['widgets'] = get_all_widgets(self.request, session=True)
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
            except AttributeError:  # TODO: It has to be an Slide.DoesNotExist
                data = None
            ajax = 'on'
            active_sid = get_active_slide(True)
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
                .filter(Q(sid=active_sid) | Q(sid=None)).values_list(
                    'def_name', flat=True)
            for receiver, response in projector_overlays.send(
                    sender=sid, register=False, call=active_defs):
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
        content = cache.get('projector_content')
        if not content:
            content = render_block_to_string(
                self.get_template_names()[0],
                'content', self.data)
            cache.set('projector_content', content, 1)

        scrollcontent = cache.get('projector_scrollcontent')
        if not scrollcontent:
            scrollcontent = render_block_to_string(
                self.get_template_names()[0],
                'scrollcontent', self.data)
            cache.set('projector_scrollcontent', scrollcontent, 1)

        # TODO: do not call the hole data-methode, if we only need some vars
        data = cache.get('projector_data')
        if not data:
            data = self.data
            cache.set('projector_data', data)
        # clear cache if countdown is enabled
        if config['countdown_state'] == 'active':
            clear_projector_cache()
        context = super(Projector, self).get_ajax_context(**kwargs)
        content_hash = hash(content)
        context.update({
            'content': content,
            'scrollcontent': scrollcontent,
            'time': datetime.now().strftime('%H:%M'),
            'overlays': data['overlays'],
            'title': data['title'],
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
    url_name = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        try:
            set_active_slide(kwargs['sid'], kwargs['argument'])
        except KeyError:
            set_active_slide(kwargs['sid'])
        config['up'] = 0
        config['bigger'] = 100


class SelectWidgetsView(TemplateView):
    """
    Show a Form to Select the widgets.
    """
    permission_required = 'projector.can_see_dashboard'
    template_name = 'projector/select_widgets.html'

    def get_context_data(self, **kwargs):
        context = super(SelectWidgetsView, self). get_context_data(**kwargs)
        widgets = get_all_widgets(self.request)
        activated_widgets = self.request.session.get('widgets', {})
        for name, widget in widgets.items():
            initial = {'widget': activated_widgets.get(name, True)}
            if self.request.method == 'POST':
                widget.form = SelectWidgetsForm(self.request.POST, prefix=name,
                                                initial=initial)
            else:
                widget.form = SelectWidgetsForm(prefix=name, initial=initial)

        context['widgets'] = widgets
        return context

    @transaction.commit_manually
    def post(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        activated_widgets = self.request.session.get('widgets', {})

        transaction.commit()
        for name, widget in context['widgets'].items():
            if widget.form.is_valid():
                activated_widgets[name] = widget.form.cleaned_data['widget']
            else:
                transaction.rollback()
                messages.error(request, _('Errors in the form'))
                break
        else:
            transaction.commit()
            self.request.session['widgets'] = activated_widgets
        return redirect(reverse('dashboard'))


class ProjectorEdit(RedirectView):
    """
    Scale or scroll the projector.
    """
    permission_required = 'projector.can_manage_projector'
    url_name = 'dashboard'
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
    url_name = 'dashboard'
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
        clear_projector_cache()
        return {
            'state': config['countdown_state'],
            'countdown_time': config['countdown_time'],
        }


class OverlayMessageView(RedirectView):
    """
    Sets or clears the overlay message
    """
    url_name = 'dashboard'
    allow_ajax = True
    permission_required = 'projector.can_manage_projector'

    def pre_post_redirect(self, request, *args, **kwargs):
        if 'message' in request.POST:
            projector_message_set(request.POST['message_text'])
        elif 'message-clean' in request.POST:
            projector_message_delete()

    def get_ajax_context(self, **kwargs):
        clear_projector_cache()
        return {
            'overlay_message': config['projector_message'],
        }


class ActivateOverlay(RedirectView):
    """
    Activate or deactivate an overlay.
    """
    url_name = 'dashboard'
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
        clear_projector_cache()
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
    success_url_name = 'dashboard'


class CustomSlideUpdateView(UpdateView):
    """
    Update a custom slide.
    """
    permission_required = 'projector.can_manage_projector'
    template_name = 'projector/new.html'
    model = ProjectorSlide
    context_object_name = 'customslide'
    success_url_name = 'dashboard'


class CustomSlideDeleteView(DeleteView):
    """
    Delete a custom slide.
    """
    permission_required = 'projector.can_manage_projector'
    model = ProjectorSlide
    success_url_name = 'dashboard'


def register_tab(request):
    """
    Register the projector tab.
    """
    selected = request.path.startswith('/projector/')
    return Tab(
        title=_('Dashboard'),
        app='dashboard',
        url=reverse('dashboard'),
        permission=request.user.has_perm('projector.can_see_dashboard'),
        selected=selected,
    )


def get_widgets(request):
    """
    Return the widgets of the projector app
    """
    widgets = []

    # welcome widget
    context = {
        'welcometext': config['welcome_text']}
    widgets.append(Widget(
        name='welcome',
        display_name=config['welcome_title'],
        template='projector/welcome_widget.html',
        context=context,
        permission_required='projector.can_see_dashboard',
        default_column=1))

    # Projector live view widget
    widgets.append(Widget(
        name='live_view',
        display_name=_('Projector live view'),
        template='projector/live_view_widget.html',
        context=RequestContext(request, {}),
        permission_required='projector.can_see_projector',
        default_column=2))

    # Overlay Widget
    overlays = []
    for receiver, name in projector_overlays.send(sender='registerer',
                                                  register=True):
        if name is not None:
            try:
                projector_overlay = ProjectorOverlay.objects.get(
                    def_name=name)
            except ProjectorOverlay.DoesNotExist:
                projector_overlay = ProjectorOverlay(def_name=name, active=False)
                projector_overlay.save()
            overlays.append(projector_overlay)

    context = {
        'overlays': overlays,
        'countdown_time': config['countdown_time'],
        'countdown_state': config['countdown_state']}
    context.update(csrf(request))
    widgets.append(Widget(
        name='overlays',
        display_name=_('Overlays'),
        template='projector/overlay_widget.html',
        permission_required='projector.can_manage_projector',
        default_column=2,
        context=context))

    # Custom slide widget
    context = {
        'slides': ProjectorSlide.objects.all().order_by('weight'),
        'welcomepage_is_active': not bool(config["presentation"])}
    widgets.append(Widget(
        name='custom_slide',
        display_name=_('Custom Slides'),
        template='projector/custom_slide_widget.html',
        context=context,
        permission_required='projector.can_manage_projector',
        default_column=2))

    return widgets
