#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Manage script for OpenSlides.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import sys

from openslides.__main__ import main


if __name__ == "__main__":
    if len(sys.argv) == 1:
        sys.argv.append('--help')
    exit(main())
