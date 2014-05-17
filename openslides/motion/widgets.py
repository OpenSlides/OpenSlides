# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.widgets import Widget

from .models import Motion


class MotionWidget(Widget):
    """
    Motion widget.
    """
    name = 'motion'
    verbose_name = ugettext_lazy('Motions')
    required_permission = 'core.can_manage_projector'
    default_column = 1
    default_weight = 40
    icon_css_class = 'icon-file'
    template_name = 'motion/widget_motion.html'
    more_link_pattern_name = 'motion_list'

    def get_context_data(self, **context):
        return super(MotionWidget, self).get_context_data(
            motions=Motion.objects.all(),
            **context)
