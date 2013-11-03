# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget

from .models import Assignment


def get_assignment_widget(sender, request, **kwargs):
    return Widget(
        name='assignments',
        display_name=_('Elections'),
        template='assignment/widget.html',
        context={'assignments': Assignment.objects.all()},
        request=request,
        permission_required='projector.can_manage_projector',
        default_column=1,
        default_weight=50)


# TODO: Move code for tab/main menu entry into this file.
