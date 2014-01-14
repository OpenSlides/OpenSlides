# -*- coding: utf-8 -*-

from django.dispatch import receiver

from openslides.utils.signals import template_manipulation


@receiver(template_manipulation, dispatch_uid="add_assignment_stylesheets")
def add_assignment_stylesheets(sender, request, context, **kwargs):
    """
    Adds the assignment.css to the context.
    """
    context['extra_stylefiles'].append('css/assignment.css')
