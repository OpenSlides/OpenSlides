# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.widgets import Widget

from .models import Group, User


class UserWidget(Widget):
    """
    Provides a widget with all users. This is for short activation of
    user slides.
    """
    name = 'user'
    verbose_name = ugettext_lazy('Participants')
    required_permission = 'core.can_manage_projector'
    default_column = 1
    default_weight = 60
    default_active = False
    template_name = 'participant/widget_user.html'
    more_link_pattern_name = 'user_overview'

    def get_context_data(self, **context):
        return super(UserWidget, self).get_context_data(
            users=User.objects.all(),
            **context)


class GroupWidget(Widget):
    """
    Provides a widget with all groups. This is for short activation of
    group slides.
    """
    name = 'group'
    verbose_name = ugettext_lazy('Groups')
    required_permission = 'core.can_manage_projector'
    default_column = 1
    default_weight = 70
    default_active = False
    template_name = 'participant/widget_group.html'
    more_link_pattern_name = 'user_group_overview'

    def get_context_data(self, **context):
        return super(GroupWidget, self).get_context_data(
            groups=Group.objects.all(),
            **context)
