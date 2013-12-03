# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.personal_info import PersonalInfo

from .models import Assignment


class AssignmentPersonalInfo(PersonalInfo):
    """
    Class for personal info block for the assignment app.
    """
    headline = ugettext_lazy('I am candidate for the following elections')
    default_weight = 40

    def get_queryset(self):
        return Assignment.objects.filter(
            assignmentcandidate__person=self.request.user,
            assignmentcandidate__blocked=False)
