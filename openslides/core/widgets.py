# -*- coding: utf-8 -*-

from openslides.config.api import config

from openslides.utils.widgets import Widget


class WelcomeWidget(Widget):
    """
    Welcome widget with static info for all users.
    """
    name = 'welcome'
    permission_required = 'projector.can_see_dashboard'
    default_column = 1
    default_weight = 10
    template_name = 'core/widget_welcome.html'
    stylesheets = ['styles/core.css']

    def get_verbose_name(self):
        return config['welcome_title']
