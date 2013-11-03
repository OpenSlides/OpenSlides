# -*- coding: utf-8 -*-

from openslides.core.widgets import Widget
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.test import TestCase


class WidgetObject(TestCase):
    def test_error(self):
        with self.assertRaises(OpenSlidesError):
            Widget(name='chahghuyeim8ie0Noong')

    def test_repr(self):
        w = Widget(name='abcdefgäöüß', html='<strong>html</strong>')
        self.assertEqual(repr(w), repr('Abcdefgäöüß'))
