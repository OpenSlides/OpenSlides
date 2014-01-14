# -*- coding: utf-8 -*-

from django.dispatch import receiver

from openslides.utils.signals import template_manipulation


@receiver(template_manipulation, dispatch_uid="add_mediafile_stylesheets")
def add_mediafile_stylesheets(sender, request, context, **kwargs):
    """
    Adds the mediafile.css to the context.
    """
    context['extra_stylefiles'].append('css/mediafile.css')
