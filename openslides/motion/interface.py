# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget

from .models import Motion


def get_motion_widget(sender, request, **kwargs):
    """
    Return the motion widget for the dashboard.
    """
    return Widget(
        name='motions',
        display_name=_('Motions'),
        template='motion/widget.html',
        context={'motions': Motion.objects.all()},
        request=request,
        permission_required='projector.can_manage_projector',
        default_column=1,
        default_weight=40)


# TODO: Add code for main meny entry (tab) here.
