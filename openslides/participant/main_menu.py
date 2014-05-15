# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class ParticipantMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the participant app.
    """
    verbose_name = ugettext_lazy('Participants')
    required_permission = 'participant.can_see_participant'
    default_weight = 50
    pattern_name = 'user_overview'
    icon_css_class = 'icon-user'
