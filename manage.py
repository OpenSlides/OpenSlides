#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.manage
    ~~~~~~~~~~~~~~~~~

    Django's execute manager.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.core.management import execute_manager

import os, site

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

site.addsitedir(os.path.join(SITE_ROOT, 'openslides'))

try:
    from openslides import settings
except ImportError:
    import sys
    sys.stderr.write("Error: Can't find the file 'settings.py' in the directory containing %r. It appears you've customized things.\nYou'll have to run django-admin.py, passing it your settings module.\n(If the file settings.py does indeed exist, it's causing an ImportError somehow.)\n" % __file__)
    sys.exit(1)

if __name__ == "__main__":
    execute_manager(settings)
