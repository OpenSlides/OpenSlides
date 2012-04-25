#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.translation_ext
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Localizable descriptions for django permissions.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.utils.translation import ugettext as _ugettext
from django.forms import ChoiceField, ModelChoiceField, ModelMultipleChoiceField


class LocalizedModelChoiceField(ModelChoiceField):
        def __init__(self, *args, **kwargs):
                super(LocalizedModelChoiceField, self).__init__(*args, **kwargs)

        def _localized_get_choices(self):
                if hasattr(self, '_choices'):
                        return self._choices

                c = []
                for (id, text) in super(LocalizedModelMultipleChoiceField, self)._get_choices():
                        text = text.split(' | ')[-1]
                        c.append((id, ugettext(text)))
                return c

        choices = property(_localized_get_choices, ChoiceField._set_choices)


class LocalizedModelMultipleChoiceField(ModelMultipleChoiceField):
        def __init__(self, *args, **kwargs):
                self.to_field_name = kwargs.get('to_field_name', None)
                super(LocalizedModelMultipleChoiceField, self).__init__(*args, **kwargs)

        def _localized_get_choices(self):
                if hasattr(self, '_choices'):
                        return self._choices

                c = []
                for (id, text) in super(LocalizedModelMultipleChoiceField, self)._get_choices():
                        text = text.split(' | ')[-1]
                        c.append((id, ugettext(text)))
                return c

        choices = property(_localized_get_choices, ChoiceField._set_choices)


def ugettext(msg, fixstr=False):
    if fixstr:
        return msg
    else:
        return _ugettext(msg)
