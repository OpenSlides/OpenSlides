# -*- coding: utf-8 -*-

from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext as _

from openslides.config.api import config
from openslides.projector.projector import Widget


def get_widgets(request):
    """
    Returns the widgets of the account app. It is only the personal_info_widget.
    """
    if not isinstance(request.user, AnonymousUser):
        return [get_personal_info_widget(request)]
    else:
        return []


def get_personal_info_widget(request):
    """
    Provides a widget for personal info. It shows your submitted and supported
    motions, where you are on the list of speakers and where you are supporter
    or candidate. If one of the modules agenda, motion or assignment does
    not exist, it is not loaded. If all does not exist, the widget disapears.
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
            'config_motion_min_supporters': config['motion_min_supporters'],
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
        return Widget(
            request,
            name='personal_info',
            display_name=_('My items, motions and elections'),
            template='account/personal_info_widget.html',
            context=personal_info_context,
            permission_required=None,
            default_column=1,
            default_weight=80)
