# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class ParticipantEntry(MainMenuEntry):
    """
    Main menu entry for the participant app.
    """
    verbose_name = ugettext_lazy('Participants')
    default_weight = 50
    pattern_name = 'user_overview'
    icon_css_class = 'icon-user'
    stylesheets = ['styles/participant.css']
    selected_path = '/participant/'

    def check_permission(self):
        return (
            self.request.user.has_perm('participant.can_see_participant') or
            self.request.user.has_perm('participant.can_manage_participant'))
