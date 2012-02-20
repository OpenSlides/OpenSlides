#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.api
    ~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the agenda app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from system import config


def is_summary():
    """
    True, if a summery shall be displayed
    """
    if config['agenda_summary']:
        return True
    return False
