#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the projector app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib import messages
from django.core.context_processors import csrf
from django.core.urlresolvers import reverse
from django.db import transaction
from django.shortcuts import redirect
from django.utils.translation import ugettext as _

from openslides.config.api import config
from openslides.utils.template import Tab
from openslides.utils.views import (AjaxMixin, CreateView, DeleteView,
                                    RedirectView, TemplateView, UpdateView)

from .api import (get_active_slide, get_all_widgets, get_overlays,
                  get_projector_content, get_projector_overlays,
                  get_projector_overlays_js, reset_countdown, set_active_slide,
                  start_countdown, stop_countdown, update_projector_overlay)
from .forms import SelectWidgetsForm
from .models import ProjectorSlide
from .projector import Widget
from .signals import projector_overlays


class DashboardView(AjaxMixin, TemplateView):
    """
    Overview over all possible slides, the overlays and a liveview.
    """
    template_name = 'projector/dashboard.html'
    permission_required = 'projector.can_see_dashboard'

    def get_context_data(self, **kwargs):
        context = super(DashboardView, self).get_context_data(**kwargs)

        context['widgets'] = get_all_widgets(self.request, session=True)
        return context


class Projector(TemplateView):
    """
    The Projector-Page.
    """
    permission_required = 'projector.can_see_projector'
    template_name = 'projector.html'

    def get_context_data(self, **kwargs):
        slide_dict = dict(self.request.GET.items())
        callback = self.kwargs.get('callback', None)
        if callback:
            slide_dict['callback'] = callback

        if not slide_dict:
            kwargs.update({
                'content':  get_projector_content(),
                'overlays': get_projector_overlays(),
                'overlay_js': get_projector_overlays_js(),
                'reload': True})

        # For the Preview
        else:
            kwargs.update({
                'content':  get_projector_content(slide_dict),
                'reload': False})

        return super(Projector, self).get_context_data(**kwargs)


class ActivateView(RedirectView):
    """
    Activate a Slide.
    """
    permission_required = 'projector.can_manage_projector'
    url_name = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        set_active_slide(kwargs['callback'], kwargs=dict(request.GET.items()))
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
        """
        Activates or deactivates the widgets in a post request.
        """
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
        elif direction == 'down':
            config['up'] = int(config['up']) - 5
        elif direction == 'up':
            if config['up'] < 0:
                config['up'] = int(config['up']) + 5
        elif direction == 'clean':
            config['up'] = config.get_default('up')
            config['bigger'] = config.get_default('bigger')


class CountdownEdit(RedirectView):
    """
    Start, stop or reset the countdown.
    """
    permission_required = 'projector.can_manage_projector'
    url_name = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        command = kwargs['command']
        if command == 'reset':
            reset_countdown()
        elif command == 'start':
            start_countdown()
        elif command == 'stop':
            stop_countdown()
        elif command == 'set-default':
            try:
                config['countdown_time'] = \
                    int(self.request.GET['countdown_time'])
            except ValueError:
                pass
            except AttributeError:
                pass
        update_projector_overlay('projector_countdown')

    def get_ajax_context(self, **kwargs):
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
            config['projector_message'] = request.POST['message_text']
        elif 'message-clean' in request.POST:
            config['projector_message'] = ''
        update_projector_overlay('projector_message')

    def get_ajax_context(self, **kwargs):
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

    def pre_redirect(self, request, *args, **kwargs):
        overlay = get_overlays()[kwargs['name']]
        self.name = overlay.name
        if kwargs['activate']:
            if not overlay.is_active():
                overlay.set_active(True)
                update_projector_overlay(overlay)
            self.active = True
        else:
            if overlay.is_active():
                overlay.set_active(False)
                update_projector_overlay(overlay)
            self.active = False

    def get_ajax_context(self, **kwargs):
        return {'active': self.active, 'name': self.name}


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

    # Welcome widget
    widgets.append(Widget(
        request,
        name='welcome',
        display_name=config['welcome_title'],
        template='projector/welcome_widget.html',
        context={'welcometext': config['welcome_text']},
        permission_required='projector.can_see_dashboard',
        default_column=1,
        default_weight=10))

    # Projector live view widget
    widgets.append(Widget(
        request,
        name='live_view',
        display_name=_('Projector live view'),
        template='projector/live_view_widget.html',
        permission_required='projector.can_see_projector',
        default_column=2,
        default_weight=10))

    # Overlay widget
    overlays = []
    for receiver, overlay in projector_overlays.send(sender='overlay_widget', request=request):
        if overlay.widget_html_callback is not None:
            overlays.append(overlay)
    context = {'overlays': overlays}
    context.update(csrf(request))
    widgets.append(Widget(
        request,
        name='overlays',
        display_name=_('Overlays'),
        template='projector/overlay_widget.html',
        permission_required='projector.can_manage_projector',
        default_column=2,
        default_weight=20,
        context=context))

    # Custom slide widget
    welcomepage_is_active = get_active_slide().get('callback', 'default') == 'default'
    widgets.append(Widget(
        request,
        name='custom_slide',
        display_name=_('Custom Slides'),
        template='projector/custom_slide_widget.html',
        context={
            'slides': ProjectorSlide.objects.all().order_by('weight'),
            'welcomepage_is_active': welcomepage_is_active},
        permission_required='projector.can_manage_projector',
        default_column=2,
        default_weight=30))

    return widgets
