#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os

from openslides.utils.main import create_settings

if __name__ == "__main__":
    cwd = os.getcwd()
    data = {
        'local_share': cwd,
        'debug': True}

    create_settings(os.path.join(cwd, 'settings.py'), **data)
