from types import GeneratorType
from unittest.mock import MagicMock

from openslides.utils.forms import LocalizedModelMultipleChoiceField
from openslides.utils.test import TestCase


class TestLocalizedModelMultipleChoiceField(TestCase):
    def test_localized_get_choices(self):
        test_field = LocalizedModelMultipleChoiceField(queryset=MagicMock())

        self.assertEqual(type(test_field.choices), GeneratorType)
