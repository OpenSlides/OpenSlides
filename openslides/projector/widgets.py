# -*- coding: utf-8 -*-

from django.core.context_processors import csrf
from django.utils.translation import ugettext_lazy

from openslides.utils.widgets import Widget

from .signals import projector_overlays


class ProjectorLiveWidget(Widget):
    """
    Widget with a live view of the projector.
    """
    name = 'live_view'
    verbose_name = ugettext_lazy('Projector live view')
    required_permission = 'core.can_see_projector'
    default_column = 2
    default_weight = 10
    template_name = 'projector/widget_live_view.html'
    icon_css_class = 'icon-facetime-video'


class OverlayWidget(Widget):
    """
    Widget to control all overlays.
    """
    name = 'overlays'  # TODO: Use singular here
    verbose_name = ugettext_lazy('Overlays')
    required_permission = 'core.can_manage_projector'
    default_column = 2
    default_weight = 20
    template_name = 'projector/widget_overlay.html'
    icon_css_class = 'icon-star'

    def get_context_data(self, **context):
        """
        Inserts all overlays into the context. The overlays are collected by
        the projector_overlays signal.
        """
        overlays = [overlay for __, overlay in projector_overlays.send(sender='overlay_widget', request=self.request)
                    if overlay.widget_html_callback is not None]
        context.update(csrf(self.request))
        return super(OverlayWidget, self).get_context_data(
            overlays=overlays,
            **context)
