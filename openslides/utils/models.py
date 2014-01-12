# -*- coding: utf-8 -*-

from django.db import models


class MinMaxIntegerField(models.IntegerField):
    """
    IntegerField with options to set a min- and a max-value.
    """

    def __init__(self, min_value=None, max_value=None, *args, **kwargs):
        self.min_value, self.max_value = min_value, max_value
        super(MinMaxIntegerField, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        defaults = {'min_value': self.min_value, 'max_value': self.max_value}
        defaults.update(kwargs)
        return super(MinMaxIntegerField, self).formfield(**defaults)


class AbsoluteUrlMixin(object):
    """
    Mixin that raises a ValueError if the name of an url was not found with
    get_absolute_url.

    The Mixin has to be placed as last OpenSlides-Mixin before the django
    model class.
    """

    def get_absolute_url(self, link=None):
        """
        Raises a ValueError.
        """
        raise ValueError('Unknown Link "%s" for model "%s"' % (link, type(self)))
