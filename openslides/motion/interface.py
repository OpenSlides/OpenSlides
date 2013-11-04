# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget

from .models import Motion


class MotionWidget(Widget):
    """
    Motion widget for the dashboard.
    """
    name = 'motions'
    display_name = _('Motions')
    permission_required = 'projector.can_manage_projector'
    default_column = 1
    default_weight = 40
    template_name = 'motion/widget.html'
    context = {'motions': Motion.objects.all()}


# TODO: Add code for main meny entry (tab) here.
