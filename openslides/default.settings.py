#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.default.settings
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Global settings file.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

# Django settings for openslides project.
from openslides_settings import *

DEBUG = True
TEMPLATE_DEBUG = DEBUG

TIME_ZONE = 'Europe/Berlin'

LANGUAGE_CODE = 'de'

# Make this unique, and don't share it with anybody.
SECRET_KEY = '=(v@$58k$fcl4y8t2#q15y-9p=^45y&!$!ap$7xo6ub$akg-!5'

# Put your OpenSlides Plugins in this List
INSTALLED_PLUGINS = (

)


INSTALLED_APPS += INSTALLED_PLUGINS
