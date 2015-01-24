from unittest import TestCase

from openslides.utils.models import AbsoluteUrlMixin


class TestAbsoluteUrlMixin(TestCase):
    def test_get_absolute_url(self):
        """
        Tests, that AbsoluteUrlMixin raises a ValueError if called.
        """
        object = AbsoluteUrlMixin()

        with self.assertRaisesRegex(
                ValueError,
                'Unknown Link "argument" for model "<class \'openslides.utils.models.AbsoluteUrlMixin\'>"'):
            object.get_absolute_url('argument')
