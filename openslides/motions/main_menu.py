from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class MotionMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the motion app.
    """
    verbose_name = ugettext_lazy('Motions')
    required_permission = 'motions.can_see'
    default_weight = 30
    pattern_name = '/motions'  # TODO: use generic solution, see issue #1469
    icon_css_class = 'glyphicon-file'
