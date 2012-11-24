#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.csv_ext
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Additional dialect definitions for pythons CSV module.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from csv import Dialect, excel, register_dialect


class excel_semikolon(Dialect):
    delimiter = ';'
    doublequote = True
    lineterminator = '\r\n'
    quotechar = '"'
    quoting = 0
    skipinitialspace = False


def patchup(dialect):
    if dialect:
        if dialect.delimiter in [excel_semikolon.delimiter, excel.delimiter] and \
                dialect.quotechar == excel_semikolon.quotechar:
            # walks like a duck and talks like a duck.. must be one
            dialect.doublequote = True
    return dialect

register_dialect("excel_semikolon", excel_semikolon)
