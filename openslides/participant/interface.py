# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget

from .models import Group, User


def get_participant_user_widget(sender, request, **kwargs):
    """
    Provides a widget with all users. This is for short activation of
    user slides.
    """
    return Widget(
        name='user',
        display_name=_('Participants'),
        template='participant/user_widget.html',
        context={'users': User.objects.all()},
        request=request,
        permission_required='projector.can_manage_projector',
        default_column=1,
        default_weight=60)


def get_participant_group_widget(sender, request, **kwargs):
    """
    Provides a widget with all groups. This is for short activation of
    group slides.
    """
    return Widget(
        name='group',
        display_name=_('Groups'),
        template='participant/group_widget.html',
        context={'groups': Group.objects.all()},
        request=request,
        permission_required='projector.can_manage_projector',
        default_column=1,
        default_weight=70)


# TODO: Add code for main meny entry (tab) here.
