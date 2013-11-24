#!/usr/bin/env python
# -*- coding: utf-8 -*-

from django.template.loader import render_to_string

from openslides.config.api import config
from openslides.projector.api import register_slide, SlideError

from .models import Mediafile


def mediafile_presentation_as_slide(**kwargs):
    """
    Return the html code for a presentation of a Mediafile.

    At the moment, only the presentation of pdfs is supported.
    """
    file_pk = kwargs.get('pk', None)
    page_num = kwargs.get('page_num', 1)

    try:
        pdf = Mediafile.objects.get(
            pk=file_pk,
            filetype__in=Mediafile.PRESENTABLE_FILE_TYPES,
            is_presentable=True)
    except Mediafile.DoesNotExist:
        raise SlideError
    context = {'pdf': pdf, 'page_num': page_num,
               'fullscreen': config['pdf_fullscreen']}
    return render_to_string('mediafile/presentation_slide.html', context)


register_slide('mediafile', mediafile_presentation_as_slide, Mediafile)
