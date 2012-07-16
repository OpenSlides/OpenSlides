#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.default.settings
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Global Django settings file for OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from openslides_settings import *

# Use 'DEBUG = True' to get more details for server errors (Default for relaeses: 'False')
DEBUG = False
TEMPLATE_DEBUG = DEBUG

# Set timezone
TIME_ZONE = 'Europe/Berlin'

# Make this unique, and don't share it with anybody.
SECRET_KEY = '=(v@$58k$fcl4y8t2#q15y-9p=^45y&!$!ap$7xo6ub$akg-!5'

# Add OpenSlides plugins to this list (see example entry in comment)
INSTALLED_PLUGINS = (
#    'pluginname',
)

INSTALLED_APPS += INSTALLED_PLUGINS
