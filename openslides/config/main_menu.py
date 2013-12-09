# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry

from .signals import config_signal


class ConfigMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the config app.
    """
    verbose_name = ugettext_lazy('Configuration')
    default_weight = 70
    pattern_name = 'config_first_config_collection_view'
    icon_css_class = 'icon-cog'

    def check_permission(self):
        """
        Checks against all permissions of all config collections.
        """
        for receiver, config_collection in config_signal.send(sender=self):
            if config_collection.is_shown():
                if self.request.user.has_perm(config_collection.required_permission):
                    return_value = True
                    break
        else:
            return_value = False
        return return_value
