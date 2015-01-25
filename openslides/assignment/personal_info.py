from django.utils.translation import ugettext_lazy

from openslides.utils.personal_info import PersonalInfo

from .models import Assignment, AssignmentRelatedUser


class AssignmentPersonalInfo(PersonalInfo):
    """
    Class for personal info block for the assignment app.
    """
    headline = ugettext_lazy('I am candidate for the following elections')
    default_weight = 40

    def get_queryset(self):
        return (Assignment.objects.filter(assignment_related_users__user=self.request.user)
                .exclude(assignment_related_users__status=AssignmentRelatedUser.STATUS_BLOCKED))
