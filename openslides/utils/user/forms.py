#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.user.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms and FormFields for the OpenSlides user api.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms

from openslides.utils.user.api import Users, get_user

class UserChoices(object):
    def __init__(self, field):
        self.field = field

    def __iter__(self):
        if self.field.empty_label is not None:
            yield (u"", self.field.empty_label)
        for user in Users():
            yield (user.uid, user)


class UserFormField(forms.fields.ChoiceField):
    def __init__(self, required=True, initial=None, empty_label=u"---------",
                 *args, **kwargs):
        if required and (initial is not None):
            self.empty_label = None
        else:
            self.empty_label = empty_label
        forms.fields.Field.__init__(self, required=required, initial=initial,
                                    *args, **kwargs)
        self.widget.choices = self.choices

    def __deepcopy__(self, memo):
        result = super(forms.fields.ChoiceField, self).__deepcopy__(memo)
        return result


    def _get_choices(self):
        # If self._choices is set, then somebody must have manually set
        # the property self.choices. In this case, just return self._choices.
        if hasattr(self, '_choices'):
            return self._choices
        return UserChoices(self)

    choices = property(_get_choices, forms.fields.ChoiceField._set_choices)

    def to_python(self, value):
        return get_user(value)

    def valid_value(self, value):
        return super(UserFormField, self).valid_value(value.uid)


class MultipleUserFormField(UserFormField):
    widget = forms.widgets.SelectMultiple

    def __init__(self, *args, **kwargs):
        super(MultipleUserFormField, self).__init__(empty_label=None,
                                                    *args, **kwargs)

    def to_python(self, value):
        if hasattr(value, '__iter__'):
            return [super(MultipleUserFormField, self).to_python(v)
                    for v in value]
        return super(MultipleUserFormField, self).to_python(value)

    def valid_value(self, value):
        if hasattr(value, '__iter__'):
            return [super(MultipleUserFormField, self).valid_value(v)
                    for v in value]
        return super(MultipleUserFormField, self).valid_value(value)
