#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Django's execute manager.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os, sys
from django.core.management import execute_from_command_line
from openslides.main import get_user_config_path, setup_django_environment

if __name__ == "__main__":
    setup_django_environment(
        get_user_config_path('openslides', 'settings.py'))
    execute_from_command_line(sys.argv)
