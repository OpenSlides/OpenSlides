#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
    openslides.assignment.tests
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Unit tests for the assignment app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test import TestCase

#TODO: Replace these tests!
class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.failUnlessEqual(1 + 1, 2)

__test__ = {"doctest": """
Another way to test that 1 + 1 is equal to 2.

>>> 1 + 1 == 2
True
"""}

