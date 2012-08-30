#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.person.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models and ModelFields for the OpenSlides person api.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from django.db import models

from openslides.utils.person.forms import PersonFormField
from openslides.utils.person.api import get_person, generate_person_id


class PersonField(models.fields.Field):
    __metaclass__ = models.SubfieldBase

    def __init__(self, *args, **kwargs):
        super(PersonField, self).__init__(max_length=255, *args, **kwargs)
        # TODO: Validate the uid

    def get_internal_type(self):
        return "CharField"

    def to_python(self, value):
        """
        Convert string value to a User Object.
        """
        if hasattr(value, 'person_id'):
            person = value
        else:
            person = get_person(value)

        person.prepare_database_save = (
            lambda unused: PersonField().get_prep_value(person))
        return person

    def get_prep_value(self, value):
        return value.person_id

    def value_to_string(self, obj):
        value = self._get_val_from_obj(obj)
        return self.get_prep_value(value)

    def formfield(self, **kwargs):
        defaults = {'form_class': PersonFormField}
        defaults.update(kwargs)
        return super(PersonField, self).formfield(**defaults)


class PersonMixin(object):
    @property
    def person_id(self):
        try:
            return generate_person_id(self.person_prefix, self.pk)
        except AttributeError:
            raise AttributeError("%s has to have a attribute 'person_prefix'"
                                 % self)

    def __repr__(self):
        return 'Person: %s' % self.person_id
