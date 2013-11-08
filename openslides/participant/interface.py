# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget

from .models import Group, User


class UserWidget(Widget):
    """
    Provides a widget with all users. This is for short activation of
    user slides.
    """
    name = 'user'
    display_name = _('Participants')
    permission_required = 'projector.can_manage_projector'
    default_column = 1
    default_weight = 60
    template_name = 'participant/user_widget.html'
    context = {'users': User.objects.all()}


class GroupWidget(Widget):
    """
    Provides a widget with all groups. This is for short activation of
    group slides.
    """
    name = 'group'
    display_name = _('Groups')
    permission_required = 'projector.can_manage_projector'
    default_column = 1
    default_weight = 70
    template_name = 'participant/group_widget.html'
    context = {'groups': Group.objects.all()}


# TODO: Add code for main meny entry (tab) here.
