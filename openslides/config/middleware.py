#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.middleware
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Middleware for the config app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.config.api import config


class ConfigCacheMiddleware(object):
    """
    Middleware to refresh the config cache before processing any view.
    """
    def process_request(self, request):
        config.setup_cache()
