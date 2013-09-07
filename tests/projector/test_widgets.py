#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides widgets
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    TODO: Move this test to the correct place when the projector app is cleaned up.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.http import HttpRequest

from openslides.projector.projector import Widget
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.test import TestCase


class WidgetObject(TestCase):
    def test_error(self):
        with self.assertRaises(OpenSlidesError):
            w = Widget(HttpRequest(), name='chahghuyeim8ie0Noong')

    def test_repr(self):
        w = Widget(HttpRequest(), name='abcdefgäöüß', html='<strong>html</strong>')
        self.assertEqual(repr(w), repr('Abcdefgäöüß'))
