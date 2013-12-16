# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class MediafileMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the mediafile app.
    """
    verbose_name = ugettext_lazy('Files')
    default_weight = 60
    pattern_name = 'mediafile_list'
    icon_css_class = 'icon-paperclip'

    def check_permission(self):
        return (
            self.request.user.has_perm('mediafile.can_see') or
            self.request.user.has_perm('mediafile.can_upload') or
            self.request.user.has_perm('mediafile.can_manage'))
