from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class DashboardMainMenuEntry(MainMenuEntry):
    """
    Main menu entry to the dashboard.
    """
    verbose_name = ugettext_lazy('Dashboard')
    required_permission = 'core.can_see_dashboard'
    default_weight = 10
    icon_css_class = 'glyphicon-home'
    pattern_name = '/'  # TODO: use generic solution, see issue #1469
