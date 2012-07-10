#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.forms
    ~~~~~~~~~~~~~~~~~~~~~~

    Additional definitions for OpenSlides forms.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.utils.translation import ugettext_lazy as _


class CssClassMixin(object):
    error_css_class = 'error'
    required_css_class = 'required'


class LocalizedModelMultipleChoiceField(forms.ModelMultipleChoiceField):
    def __init__(self, *args, **kwargs):
        self.to_field_name = kwargs.get('to_field_name', None)
        super(LocalizedModelMultipleChoiceField, self).__init__(*args, **kwargs)

    def _localized_get_choices(self):
        if hasattr(self, '_choices'):
            return self._choices

        c = []
        for (id, text) in super(LocalizedModelMultipleChoiceField, self)._get_choices():
            text = text.split(' | ')[-1]
            c.append((id, _(text)))
        return c

    choices = property(_localized_get_choices, forms.ChoiceField._set_choices)
