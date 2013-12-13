# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse_lazy
from django.utils.translation import ugettext as _

from openslides.utils.menu import Menu


class AssignmentMenu(Menu):
    name = 'assignment'
    permission_required = 'assignment.can_see_assignment'
    default_weight = 30
    verbose_name = _('Elections')
    url = reverse_lazy('assignment_list')
