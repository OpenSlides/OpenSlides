# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse_lazy

from openslides.utils.menu import Menu


class AgendaMenu(Menu):
    name = 'agenda'
    permission_required = 'agenda.can_see_agenda'
    default_weight = 10
    url = reverse_lazy('item_overview')
