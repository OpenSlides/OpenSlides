#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the participant app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import Form, ModelForm, CharField, EmailField, FileField, FileInput, MultipleChoiceField, ModelMultipleChoiceField
from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.forms import AdminPasswordChangeForm
from django.utils.translation import ugettext as _

# required for USER_VISIBLE_PERMISSIONS
from agenda.models import Item
from application.models import Application
from assignment.models import Assignment
from participant.models import Profile
from system.models import Config

USER_VISIBLE_PERMISSIONS = reduce(list.__add__, [
    [p[0] for p in Item._meta.permissions],
    [p[0] for p in Application._meta.permissions],
    [p[0] for p in Assignment._meta.permissions],
    [p[0] for p in Profile._meta.permissions],
    [p[0] for p in Config._meta.permissions]
])

class UserNewForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'

    first_name = CharField(label=_("First name"))
    last_name = CharField(label=_("Last name"))

    class Meta:
        model = User
        exclude = ('username', 'password', 'is_staff', 'last_login', 'date_joined', 'user_permissions')

class UserEditForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'

    first_name = CharField(label=_("First name"))
    last_name = CharField(label=_("Last name"))

    class Meta:
        model = User
        exclude = ('password', 'is_staff', 'last_login', 'date_joined', 'user_permissions')

class UsernameForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'

    class Meta:
        model = User
        exclude = ('first_name', 'last_name', 'email', 'is_active','is_superuser', 'groups', 'password', 'is_staff', 'last_login', 'date_joined', 'user_permissions')

class ProfileForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'

    class Meta:
        model = Profile

class GroupForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'
    permissions = ModelMultipleChoiceField(queryset=Permission.objects.filter(codename__in=USER_VISIBLE_PERMISSIONS))

    def __init__(self, *args, **kwargs):
        super(GroupForm, self).__init__(*args, **kwargs)
        if kwargs.get('instance', None) is not None:
            self.fields['permissions'].initial = [p.pk for p in kwargs['instance'].permissions.all()]

    class Meta:
        model = Group
        exclude = ('permissions',)

class UsersettingsForm(UserEditForm):
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email')

class UserImportForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'

    csvfile = FileField(widget=FileInput(attrs={'size':'50'}), label=_("CSV File"))
