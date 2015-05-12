from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class MediafileMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the mediafile app.
    """
    verbose_name = ugettext_lazy('Files')
    default_weight = 60
    pattern_name = '/mediafiles'
    icon_css_class = 'glyphicon-paperclip'

    def check_permission(self):
        return (
            self.request.user.has_perm('mediafiles.can_see') or
            self.request.user.has_perm('mediafiles.can_upload') or
            self.request.user.has_perm('mediafiles.can_manage'))
