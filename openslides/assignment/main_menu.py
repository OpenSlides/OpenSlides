# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.main_menu import MainMenuEntry


class AssignmentEntry(MainMenuEntry):
    """
    Main menu entry for the assignment app.
    """
    verbose_name = ugettext_lazy('Elections')
    default_weight = 40
    pattern_name = 'assignment_list'
    icon_css_class = 'icon-charts'
    stylesheets = ['styles/assignment.css']
    selected_path = '/assignment/'

    def check_permission(self):
        return (
            self.request.user.has_perm('assignment.can_see_assignment') or
            self.request.user.has_perm('assignment.can_nominate_other') or
            self.request.user.has_perm('assignment.can_nominate_self') or
            self.request.user.has_perm('assignment.can_manage_assignment'))
