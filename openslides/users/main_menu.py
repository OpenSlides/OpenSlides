from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class UserMainMenuEntry(MainMenuEntry):
    """
    Main menu entry for the participant app.
    """
    verbose_name = ugettext_lazy('Users')
    required_permission = 'users.can_see_extra_data'
    default_weight = 50
    pattern_name = '/users'  # TODO: use generic solution, see issue #1469
    icon_css_class = 'glyphicon-user'
