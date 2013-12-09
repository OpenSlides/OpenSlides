# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.personal_info import PersonalInfo

from .models import Item


class AgendaPersonalInfo(PersonalInfo):
    """
    Class for personal info block for the agenda app.
    """
    headline = ugettext_lazy('I am on the list of speakers of the following items')
    default_weight = 10

    def get_queryset(self):
        return Item.objects.filter(
            speaker__person=self.request.user,
            speaker__begin_time=None)
