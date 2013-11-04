# -*- coding: utf-8 -*-

from django.http import HttpRequest

from openslides.projector.projector import Widget
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.test import TestCase


class WidgetObject(TestCase):
    def test_error(self):
        with self.assertRaises(OpenSlidesError):
            Widget(HttpRequest(), name='chahghuyeim8ie0Noong')

    def test_repr(self):
        w = Widget(HttpRequest(), name='abcdefgäöüß', html='<strong>html</strong>')
        self.assertEqual(repr(w), repr('Abcdefgäöüß'))
