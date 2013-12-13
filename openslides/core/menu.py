# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse_lazy

from openslides.projector.views import DashboardView
from openslides.utils.menu import Menu


class DashboardMenu(Menu):
    name = 'dashboard'
    permission_required = 'projector.can_see_dashboard'
    default_weight = 0
    url = reverse_lazy('dashboard')

    def is_active(self):
        """
        The menu only is active on the DashboardView.
        """
        return self.view_class == DashboardView
