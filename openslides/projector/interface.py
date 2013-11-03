# -*- coding: utf-8 -*-

from django.core.context_processors import csrf
from django.utils.translation import ugettext as _

from openslides.config.api import config
from openslides.core.widgets import Widget

from .models import ProjectorSlide
from .signals import projector_overlays


def get_projector_welcome_widget(sender, request, **kwargs):
    """
    Returns the welcome widget.
    """
    return Widget(
        name='welcome',
        display_name=config['welcome_title'],
        template='projector/welcome_widget.html',
        request=request,
        permission_required='projector.can_see_dashboard',
        default_column=1,
        default_weight=10)


def get_projector_live_widget(sender, request, **kwargs):
    """
    Returns the widget with the live view of the projector.
    """
    return Widget(
        name='live_view',
        display_name=_('Projector live view'),
        template='projector/live_view_widget.html',
        request=request,
        permission_required='projector.can_see_projector',
        default_column=2,
        default_weight=10)


def get_projector_overlay_widget(sender, request, **kwargs):
    """
    Returns the widget to control all overlays.
    """
    overlays = []
    for receiver, overlay in projector_overlays.send(sender='overlay_widget', request=request):
        if overlay.widget_html_callback is not None:
            overlays.append(overlay)
    context = {'overlays': overlays}
    context.update(csrf(request))
    return Widget(
        name='overlays',
        display_name=_('Overlays'),
        template='projector/overlay_widget.html',
        context=context,
        request=request,
        permission_required='projector.can_manage_projector',
        default_column=2,
        default_weight=20)


def get_projector_custom_slide_widget(sender, request, **kwargs):
    """
    Returns the widget for custom slides.
    """
    from .api import get_active_slide
    welcomepage_is_active = get_active_slide().get('callback', 'default') == 'default'
    return Widget(
        name='custom_slide',
        display_name=_('Custom Slides'),
        template='projector/custom_slide_widget.html',
        context={
            'slides': ProjectorSlide.objects.all().order_by('weight'),
            'welcomepage_is_active': welcomepage_is_active},
        request=request,
        permission_required='projector.can_manage_projector',
        default_column=2,
        default_weight=30)
