#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.exceptions
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Exceptions for the config app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.exceptions import OpenSlidesError


class ConfigError(OpenSlidesError):
    pass


class ConfigNotFound(ConfigError):
    pass
