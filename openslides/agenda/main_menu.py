# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class AgendaMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the agenda app.
    """
    verbose_name = ugettext_lazy('Agenda')
    required_permission = 'agenda.can_see_agenda'
    default_weight = 20
    pattern_name = 'item_overview'
    icon_css_class = 'icon-calendar'
