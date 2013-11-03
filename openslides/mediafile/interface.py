# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.config.api import config
from openslides.core.widgets import Widget
from openslides.projector.api import get_active_slide

from .models import Mediafile


def get_mediafile_widget(sender, request, **kwargs):
    """
    Return the widget of the mediafile app, the presentation widget.
    """
    pdfs = Mediafile.objects.filter(
        filetype__in=Mediafile.PRESENTABLE_FILE_TYPES,
        is_presentable=True)
    current_page = get_active_slide().get('page_num', 1)
    return Widget(
        name='presentations',
        display_name=_('Presentations'),
        template='mediafile/pdfs_widget.html',
        context={'pdfs': pdfs, 'current_page': current_page,
                 'pdf_fullscreen': config['pdf_fullscreen']},
        request=request,
        permission_required='projector.can_manage_projector',
        default_column=1,
        default_weight=80)


# TODO: Add code for main meny entry (tab) here.
