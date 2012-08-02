#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.user.api
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the user object.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django import forms

from openslides.utils.user.signals import receiv_users


class UserChoices():
    def __init__(self, field):
        self.field = field

    def __iter__(self):
        if self.field.empty_label is not None:
            yield (u"", self.field.empty_label)
        for user in Users():
            yield (user.uid, user)


class UserFormField(forms.fields.ChoiceField):
    def __init__(self, required=True, initial=None, empty_label=u"---------", *args, **kwargs):

        if required and (initial is not None):
            self.empty_label = None
        else:
            self.empty_label = empty_label
        #TODO use a own self.choices property, see ModelChoiceField
        super(UserFormField, self).__init__(choices=UserChoices(field=self), required=required, initial=initial, *args, **kwargs)

    def to_python(self, value):
        print value
        return get_user(value)

    def valid_value(self, value):
        return super(UserFormField, self).valid_value(value.uid)


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

        user.prepare_database_save = lambda unused: UserField().get_prep_value(user)
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


def split_uid(uid):
    data = uid.split(':', 1)
    if len(data) == 2 and data[0] and data[1]:
        return data
    raise TypeError("Invalid uid: '%s'" % uid)


def get_user(uid):
    try:
        user_type, id = split_uid(uid)
    except TypeError:
        return EmtyUser()

    for receiver, users_list in receiv_users.send(sender='get_user'):
        for users in users_list:
            if users.user_prefix == user_type:
                return users[id]
    # TODO: Use own Exception
    raise Exception('User with uid %s does not exist' % uid)


class Users(object):
    """
    A Storage for a multiplicity of different User-Objects.
    """
    def __iter__(self):
        for receiver, users_list in receiv_users.send(sender='users'):
            for users in users_list:
                # Does iter(users) work?
                print users
                for user in users:
                    print user
                    yield user


def generate_uid(prefix, id):
    if ':' in prefix:
        # TODO: Use the right Error.
        raise Exception("':' is not allowed in a the 'user_prefix'")
    return "%s:%d" % (prefix, id)


# TODO: I dont need this object any more
class UserMixin(object):
    @property
    def uid(self):
        try:
            return generate_uid(self.user_prefix, self.id)
        except AttributeError:
            raise AttributeError("%s has to have a attribute 'user_prefix'" % self)

    def __repr__(self):
        return 'User: %s' % self.uid


class EmtyUser(UserMixin):
    @property
    def uid(self):
        return 'emtyuser'
