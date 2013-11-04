# -*- coding: utf-8 -*-

from django.core.context_processors import csrf
from django.utils.translation import ugettext as _

from openslides.config.api import config
from openslides.core.widgets import Widget

from .api import get_active_slide
from .models import ProjectorSlide
from .signals import projector_overlays


class WelcomeWidget(Widget):
    """
    Welcome widget.
    """
    name = 'welcome'
    permission_required = 'projector.can_see_dashboard'
    default_column = 1
    default_weight = 10
    template_name = 'projector/welcome_widget.html'

    def get_display_name(self):
        return config['welcome_title']


class LiveViewWidget(Widget):
    """
    Widget with the live view of the projector.
    """
    name = 'live_view'
    display_name = _('Projector live view')
    permission_required = 'projector.can_see_projector'
    default_column = 2
    default_weight = 10
    template_name = 'projector/live_view_widget.html'


class OverlayWidget(Widget):
    """
    Widget to control all overlays.
    """
    name = 'overlays'
    display_name = _('Overlays')
    permission_required = 'projector.can_manage_projector'
    default_column = 2
    default_weight = 20
    template_name = 'projector/overlay_widget.html'

    def get_context(self):
        overlays = []
        for receiver, overlay in projector_overlays.send(sender='overlay_widget', request=self.request):
            if overlay.widget_html_callback is not None:
                overlays.append(overlay)
        context = {'overlays': overlays}
        context.update(csrf(self.request))
        return context


class CustomSlideWidget(Widget):
    """
    Widget for custom slides.
    """
    name = 'custom_slide'
    display_name = _('Custom Slides')
    permission_required = 'projector.can_manage_projector'
    default_column = 2
    default_weight = 30
    template_name = 'projector/custom_slide_widget.html'

    def get_context(self):
        welcomepage_is_active = get_active_slide().get('callback', 'default') == 'default'
        return {'slides': ProjectorSlide.objects.all().order_by('weight'),
                'welcomepage_is_active': welcomepage_is_active}
