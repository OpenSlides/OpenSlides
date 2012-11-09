#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Django's execute manager.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os, sys

if __name__ == "__main__":
    sys.path.append(os.path.join(os.path.expanduser('~'), '.config', 'openslides'))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
