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

from .forms import PersonFormField
from .api import get_person, generate_person_id


class PersonField(models.fields.Field):
    __metaclass__ = models.SubfieldBase

    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 255
        super(PersonField, self).__init__(*args, **kwargs)

    def get_internal_type(self):
        return "CharField"

    def to_python(self, value):
        """
        Convert string value to a User Object.
        """
        if isinstance(value, PersonMixin):
            return value
        elif value is None:
            return None
        else:
            return get_person(value)

    def get_prep_value(self, value):
        """
        Convert a person object to a string, to store it in the database.
        """
        if value is None:
            return None
        elif isinstance(value, basestring):
            return value
        else:
            return value.person_id

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

    def __unicode__(self):
        return 'MyPerson: %s' % self.person_id

    def prepare_database_save(self, field):
        if type(field) is PersonField:
            return self.person_id
        else:
            return super(PersonMixin, self).prepare_database_save(field)
