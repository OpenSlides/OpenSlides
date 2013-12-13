# -*- coding: utf-8 -*-

from django.dispatch import receiver

from openslides.utils.signals import template_manipulation


@receiver(template_manipulation, dispatch_uid="mediafile_styles")
def mediafile_styles(sender, request, context, **kwargs):
    context.setdefault('extra_stylefiles', [])
    context['extra_stylefiles'].append('styles/mediafile.css')
