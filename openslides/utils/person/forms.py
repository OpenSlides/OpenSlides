# -*- coding: utf-8 -*-

from django import forms

from openslides.utils.person.api import get_person, Persons


class PersonChoices(object):
    def __init__(self, field):
        self.field = field

    def __iter__(self):
        if self.field.empty_label is not None:
            yield (u'', self.field.empty_label)
        for person in sorted(Persons(), key=lambda person: person.sort_name):
            yield (person.person_id, person)


class PersonFormField(forms.fields.ChoiceField):
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
        return PersonChoices(self)

    choices = property(_get_choices, forms.fields.ChoiceField._set_choices)

    def to_python(self, value):
        if value == u'':
            return u''
        return get_person(value)

    def valid_value(self, value):
        return super(PersonFormField, self).valid_value(value.person_id)


class MultiplePersonFormField(PersonFormField):
    widget = forms.widgets.SelectMultiple

    def __init__(self, *args, **kwargs):
        super(MultiplePersonFormField, self).__init__(
            empty_label=None, *args, **kwargs)

    def to_python(self, value):
        if hasattr(value, '__iter__'):
            return [super(MultiplePersonFormField, self).to_python(v)
                    for v in value]
        return super(MultiplePersonFormField, self).to_python(value)

    def valid_value(self, value):
        if hasattr(value, '__iter__'):
            return [super(MultiplePersonFormField, self).valid_value(v)
                    for v in value]
        return super(MultiplePersonFormField, self).valid_value(value)
