# -*- coding: utf-8 -*-

from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget


class PersonalInfoWidget(Widget):
    """
    The personal info widget which is not shown for an anonymous user.
    """
    name = 'personal_info'
    display_name = _('My items, motions and elections')
    default_column = 1
    default_weight = 90
    template_name = 'account/personal_info_widget.html',

    def is_shown(self):
        """
        Returns false for an anonymous user or if there is no context, else
        true.
        """
        return not (isinstance(self.request.user, AnonymousUser) or not bool(self.get_context()))

    def get_context(self):
        """
        Provides the context for personal info. It shows your submitted and
        supported motions, where you are on the list of speakers and where
        you are candidate. If one of the modules agenda, motion or
        assignment does not exist, it is not loaded. If all do not exist,
        the widget disapears.
        """
        personal_info_context = {}

        try:
            from openslides.agenda.models import Item
        except ImportError:
            pass
        else:
            personal_info_context.update({
                'items': Item.objects.filter(
                    speaker__person=self.request.user,
                    speaker__begin_time=None)})
        try:
            from openslides.motion.models import Motion
        except ImportError:
            pass
        else:
            personal_info_context.update({
                'submitted_motions': Motion.objects.filter(submitter__person=self.request.user),
                'supported_motions': Motion.objects.filter(supporter__person=self.request.user)})
        try:
            from openslides.assignment.models import Assignment
        except ImportError:
            pass
        else:
            personal_info_context.update({
                'assignments': Assignment.objects.filter(
                    assignmentcandidate__person=self.request.user,
                    assignmentcandidate__blocked=False)})

        return personal_info_context
