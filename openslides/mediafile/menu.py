# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse_lazy
from django.utils.translation import ugettext as _

from openslides.utils.menu import Menu


class MediaFileMenu(Menu):
    name = 'mediafile'
    permission_required = 'mediafile.can_see'
    default_weight = 50
    verbose_name = _('Files')
    url = reverse_lazy('mediafile_list')
    icon_css_class = 'icon-mediafile'
