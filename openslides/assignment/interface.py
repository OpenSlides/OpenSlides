# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget

from .models import Assignment


class AssignmentWidget(Widget):
    """
    Widget for all assignments.
    """
    name = 'assignments'
    display_name = _('Elections')
    permission_required = 'projector.can_manage_projector'
    default_column = 1
    default_weight = 50
    template_name = 'assignment/widget.html'
    context = {'assignments': Assignment.objects.all()}


# TODO: Move code for tab/main menu entry into this file.
