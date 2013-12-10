# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class AgendaEntry(MainMenuEntry):
    """
    Main menu entry for the agenda app.
    """
    verbose_name = ugettext_lazy('Agenda')
    default_weight = 20
    pattern_name = 'item_overview'
    icon_css_class = 'icon-calendar'
    stylesheets = ['styles/agenda.css']
    selected_path = '/agenda/'

    def check_permission(self):
        return (self.request.user.has_perm('agenda.can_see_agenda') or
                self.request.user.has_perm('agenda.can_manage_agenda'))
