#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.csv_ext
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Additional dialect definitions for pythons CSV module.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from csv import Dialect, excel, register_dialect

class excel_semikolon(excel):
	delimiter = ';'


register_dialect("excel_semikolon", excel_semikolon)

