# -*- coding: utf-8 -*-

from openslides.utils.models import AbsoluteUrlMixin
from openslides.utils.test import TestCase


class MyModel(AbsoluteUrlMixin):
    """"
    Model for testing
    """
    def get_absolute_url(self, link='default'):
        if link == 'default' or link == 'known':
            url = 'my url'
        else:
            url = super(MyModel, self).get_absolute_url(link)
        return url


class TestAbsoluteUrlMixin(TestCase):
    def test_get_absolute_url(self):
        my_object = MyModel()

        self.assertEqual(my_object.get_absolute_url(), 'my url')
        self.assertEqual(my_object.get_absolute_url('known'), 'my url')
        self.assertRaisesMessage(
            ValueError,
            'Unknown Link "unknown" for model "<class \'tests.utils.test_models.MyModel\'>"',
            my_object.get_absolute_url, 'unknown')
