#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.account.views
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the account app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.utils.translation import ugettext as _

from openslides.config.api import config
from openslides.projector.projector import Widget


def get_widgets(request):
    """
    Returns the widgets of the account app. It is only a personal_info_widget.
    """
    return [get_personal_info_widget(request)]


def get_personal_info_widget(request):
    """
    Provides a widget for personal info. It shows your submitted and supported
    motions and where you are supporter or candidate. If one of the modules
    motion or assignment does not exist, it is not loaded. If both don't
    exist, the widget disapears.
    """
    personal_info_context = {}

    try:
        from openslides.motion.models import Motion
    except ImportError:
        pass
    else:
        personal_info_context.update({
            'submitted_motions': Motion.objects.filter(submitter=request.user),
            'config_motion_min_supporters': config['motion_min_supporters'],
            'supported_motions': Motion.objects.filter(supporter=request.user)})

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
            name='personal_info',
            display_name=_('My motions and elections'),
            template='account/personal_info_widget.html',
            context=personal_info_context,
            permission_required=None,
            default_column=1)
