# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class ConfigEntry(MainMenuEntry):
    """
    Main menu entry for the config app.
    """
    verbose_name = ugettext_lazy('Configuration')
    permission_required = 'config.can_manage'
    default_weight = 70
    pattern_name = 'config_first_config_collection_view'
    icon_css_class = 'icon-wrench'
    stylesheets = ['styles/config.css']
    selected_path = '/config/'
