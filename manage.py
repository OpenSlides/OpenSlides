#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Django's execute manager.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os, sys
from django.core.management import execute_manager

sys.path.append(os.path.join(os.path.expanduser('~'), '.config'))

try:
    from openslides_config import settings
except ImportError:
    sys.stderr.write("Error: Can not find the file 'settings.py'. Please create it with the start-script\n")
    sys.exit(1)


if __name__ == "__main__":
    execute_manager(settings)
