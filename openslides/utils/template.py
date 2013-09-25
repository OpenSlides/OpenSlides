#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.template
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Useful template functions for OpenSlides.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""


class Tab(object):
    """
    Entry for the main menu of OpenSlides.
    """
    def __init__(self, title='', app='', stylefile='', url='', permission=True, selected=False):
        self.title = title
        self.app = app
        self.stylefile = stylefile
        self.url = url
        self.permission = permission
        self.selected = selected
