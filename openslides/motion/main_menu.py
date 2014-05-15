# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class MotionMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the motion app.
    """
    verbose_name = ugettext_lazy('Motions')
    required_permission = 'motion.can_see_motion'
    default_weight = 30
    pattern_name = 'motion_list'
    icon_css_class = 'icon-file'
