from unittest import TestCase

from openslides.utils import utils


class ToRomanTest(TestCase):
    def test_to_roman_result(self):
        self.assertEqual(utils.to_roman(3), 'III')

    def test_to_roman_none(self):
        self.assertEqual(utils.to_roman(-3), '-3')
