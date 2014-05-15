# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.widgets import Widget

from .models import Assignment


class AssignmentWidget(Widget):
    """
    Assignment widget.
    """
    name = 'assignment'
    verbose_name = ugettext_lazy('Elections')
    required_permission = 'core.can_manage_projector'
    default_column = 1
    default_weight = 50
    template_name = 'assignment/widget_assignment.html'
    more_link_pattern_name = 'assignment_list'

    def get_context_data(self, **context):
        return super(AssignmentWidget, self).get_context_data(
            assignments=Assignment.objects.all(),
            **context)
