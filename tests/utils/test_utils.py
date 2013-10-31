# -*- coding: utf-8 -*-

from openslides.utils.test import TestCase
from openslides.utils.utils import html_strong, int_or_none


class Test_functions(TestCase):
    def test_string(self):
        self.assertEqual(html_strong('some text'), '<strong>some text</strong>')

    def test_int_or_none(self):
        self.assertEqual(int_or_none('5'), 5)
        self.assertEqual(int_or_none(5), 5)
        self.assertIsNone(int_or_none('text'))
        self.assertIsNone(int_or_none(None))
