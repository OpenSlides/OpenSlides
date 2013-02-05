#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.signales
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the motion app.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import receiver
from django.utils.translation import ugettext as _

from openslides.config.signals import default_config_value


@receiver(default_config_value, dispatch_uid="motion_default_config")
def default_config(sender, key, **kwargs):
    """Return the default config values for the motion app."""
    return {
        'motion_min_supporters': 0,
        'motion_preamble': _('The assembly may decide,'),
        'motion_pdf_ballot_papers_selection': 'CUSTOM_NUMBER',
        'motion_pdf_ballot_papers_number': '8',
        'motion_pdf_title': _('Motions'),
        'motion_pdf_preamble': '',
        'motion_create_new_version': 'ALLWASY_CREATE_NEW_VERSION',
        'motion_workflow': 'default'}.get(key)
