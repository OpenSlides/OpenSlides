# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.widgets import Widget
from openslides.projector.api import get_active_slide

from .models import Mediafile


class PDFPresentationWidget(Widget):
    """
    Widget for presentable PDF files.
    """
    name = 'presentations'
    verbose_name = ugettext_lazy('Presentations')
    required_permission = 'core.can_manage_projector'
    default_column = 1
    default_weight = 75
    template_name = 'mediafile/widget_pdfpresentation.html'
    icon_css_class = 'icon-align-left'
    more_link_pattern_name = 'mediafile_list'
    # javascript_files = None  # TODO: Add pdf.js stuff here.

    def get_context_data(self, **context):
        pdfs = Mediafile.objects.filter(
            filetype__in=Mediafile.PRESENTABLE_FILE_TYPES,
            is_presentable=True)
        current_page = get_active_slide().get('page_num', 1)
        return super(PDFPresentationWidget, self).get_context_data(
            pdfs=pdfs,
            current_page=current_page,
            **context)
