# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class ConfigMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the config app.
    """
    verbose_name = ugettext_lazy('Configuration')
    required_permission = 'config.can_manage'
    default_weight = 70
    pattern_name = 'config_first_config_collection_view'
    icon_css_class = 'icon-cog'
