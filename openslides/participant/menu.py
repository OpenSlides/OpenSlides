# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse_lazy

from openslides.utils.menu import Menu


class ParticipantMenu(Menu):
    name = 'participant'
    permission_required = 'participant.can_see_participant'
    default_weight = 40
    url = reverse_lazy('user_overview')
