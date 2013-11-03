# -*- coding: utf-8 -*-

from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget


def get_personal_info_widget(sender, request, **kwargs):
    """
    Returns the personal info widget. Returns None for an anonymous user.
    """
    if isinstance(request.user, AnonymousUser):
        widget = None
    else:
        widget = get_personal_info_widget_with_context(request)
    return widget


def get_personal_info_widget_with_context(request):
    """
    Provides a widget for personal info. It shows your submitted and supported
    motions, where you are on the list of speakers and where you are candidate.
    If one of the modules agenda, motion or assignment does not exist, it is
    not loaded. If all do not exist, the widget disapears.
    """
    personal_info_context = {}

    try:
        from openslides.agenda.models import Item
    except ImportError:
        pass
    else:
        personal_info_context.update({
            'items': Item.objects.filter(
                speaker__person=request.user,
                speaker__begin_time=None)})
    try:
        from openslides.motion.models import Motion
    except ImportError:
        pass
    else:
        personal_info_context.update({
            'submitted_motions': Motion.objects.filter(submitter__person=request.user),
            'supported_motions': Motion.objects.filter(supporter__person=request.user)})
    try:
        from openslides.assignment.models import Assignment
    except ImportError:
        pass
    else:
        personal_info_context.update({
            'assignments': Assignment.objects.filter(
                assignmentcandidate__person=request.user,
                assignmentcandidate__blocked=False)})

    if personal_info_context:
        widget = Widget(
            name='personal_info',
            display_name=_('My items, motions and elections'),
            template='account/personal_info_widget.html',
            context=personal_info_context,
            request=request,
            permission_required=None,
            default_column=1,
            default_weight=90)
    else:
        widget = None
    return widget
