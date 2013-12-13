# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse_lazy

from openslides.utils.menu import Menu


class MotionMenu(Menu):
    name = 'motion'
    permission_required = 'motion.can_see_motion'
    default_weight = 20
    url = reverse_lazy('motion_list')
