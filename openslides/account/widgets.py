# -*- coding: utf-8 -*-

from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext_lazy

from openslides.utils.widgets import Widget


class PersonalInfoWidget(Widget):
    """
    Provides a widget for personal info. It shows your submitted and supported
    motions, where you are on the list of speakers and where you are supporter
    or candidate. If one of the modules agenda, motion or assignment does
    not exist, it is not loaded. If all does not exist, the widget disapears.
    """
    name = 'personal_info'
    verbose_name = ugettext_lazy('My items, motions and elections')
    default_column = 1
    default_weight = 80
    template_name = 'account/widget_personal_info.html'

    def check_permission(self):
        """
        The widget is disabled for anonymous users.
        """
        return not isinstance(self.request.user, AnonymousUser)

    def is_active(self):
        """
        The widget is disabled if there can neither the agenda app, nor the
        motion app nor the assignment app be found.
        """
        for module in ('agenda', 'motion', 'assignment'):
            try:
                __import__('openslides.%s' % module)
            except ImportError:
                continue
            else:
                active = True
                break
        else:
            active = False
        return active

    def get_context_data(self, **context):
        """
        Adds the context to the widget.
        """
        try:
            from openslides.agenda.models import Item
        except ImportError:
            pass
        else:
            context.update({
                'items': Item.objects.filter(
                    speaker__person=self.request.user,
                    speaker__begin_time=None)})
        try:
            from openslides.motion.models import Motion
        except ImportError:
            pass
        else:
            context.update({
                'submitted_motions': Motion.objects.filter(submitter__person=self.request.user),
                'supported_motions': Motion.objects.filter(supporter__person=self.request.user)})
        try:
            from openslides.assignment.models import Assignment
        except ImportError:
            pass
        else:
            context.update({
                'assignments': Assignment.objects.filter(
                    assignmentcandidate__person=self.request.user,
                    assignmentcandidate__blocked=False)})
        return super(PersonalInfoWidget, self).get_context_data(**context)
