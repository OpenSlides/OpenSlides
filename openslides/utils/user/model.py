#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.user.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models and ModelFields for the OpenSlides user api.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models

from openslides.utils.user.forms import UserFormField
from openslides.utils.user.api import get_user, generate_uid


class UserField(models.fields.Field):
    __metaclass__ = models.SubfieldBase

    def __init__(self, *args, **kwargs):
        super(UserField, self).__init__(max_length=255, *args, **kwargs)
        # TODO: Validate the uid

    def get_internal_type(self):
        return "CharField"

    def to_python(self, value):
        """
        Convert string value to a User Object.
        """
        if hasattr(value, 'uid'):
            user =  value
        else:
            user = get_user(value)

        user.prepare_database_save = lambda unused: UserField() \
                                                    .get_prep_value(user)
        return user

    def get_prep_value(self, value):
        return value.uid

    def value_to_string(self, obj):
        value = self._get_val_from_obj(obj)
        return self.get_prep_value(value)

    def formfield(self, **kwargs):
        defaults = {'form_class': UserFormField}
        defaults.update(kwargs)
        return super(UserField, self).formfield(**defaults)


class UserMixin(object):
    @property
    def uid(self):
        try:
            return generate_uid(self.user_prefix, self.pk)
        except AttributeError:
            raise AttributeError("%s has to have a attribute 'user_prefix'"
                                 % self)

    def __repr__(self):
        return 'User: %s' % self.uid
