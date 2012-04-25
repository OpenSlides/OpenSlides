#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.tests
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Unit tests for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test import TestCase


class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)
