# -*- coding: utf-8 -*-
from django.contrib.auth.models import AnonymousUser
from django.db import models

from openslides.utils.exceptions import OpenSlidesError

from .api import generate_person_id, get_person
from .forms import PersonFormField


class PersonField(models.fields.Field):
    __metaclass__ = models.SubfieldBase

    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 255
        super(PersonField, self).__init__(*args, **kwargs)

    def get_internal_type(self):
        return "CharField"

    def to_python(self, value):
        """
        Convert an object to an user Object.

        'value' has to be an object derivated from PersonMixin, None or has to
        have an attribute 'person_id'.
        """
        if isinstance(value, PersonMixin):
            return value
        elif value is None:
            return None
        elif isinstance(value, AnonymousUser):
            raise AttributeError('An AnonymousUser can not be saved into the database.')
        else:
            try:
                return get_person(value)
            except AttributeError:
                raise AttributeError('You can not save \'%s\' into a person field.'
                                     % type(value))

    def get_prep_value(self, value):
        """
        Convert a person object to a string, to store it in the database.
        """
        if value is None:
            # For Fields with null=True
            return None
        elif isinstance(value, basestring):
            # The object is already a a person_id
            return value

        elif hasattr(value, 'person_id'):
            # The object is a person
            return value.person_id
        else:
            OpenSlidesError('%s (%s) is no person' % (value, type(value)))

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
        return self.person_id

    def prepare_database_save(self, field):
        if type(field) is PersonField:
            return self.person_id
        else:
            return super(PersonMixin, self).prepare_database_save(field)
