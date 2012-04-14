#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the participant app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import Form, ModelForm, CharField, EmailField, FileField, FileInput, MultipleChoiceField, ModelMultipleChoiceField, ChoiceField, BooleanField
from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.forms import AdminPasswordChangeForm
from django.utils.translation import ugettext as _

from utils.forms import CssClassMixin
from utils.translation_ext import LocalizedModelMultipleChoiceField

# required for USER_VISIBLE_PERMISSIONS
from participant.models import Profile



USER_APPLICATION_IMPORT_OPTIONS = [
    ('REASSIGN', _('Keep applications, try to reassign submitter')),
    ('INREVIEW', _('Keep applications, set status to "needs review"')),
    ('DISCARD' , _('Discard applications'))
]

class UserNewForm(ModelForm, CssClassMixin):
    first_name = CharField(label=_("First name"))
    last_name = CharField(label=_("Last name"))

    class Meta:
        model = User
        exclude = ('username', 'password', 'is_staff', 'last_login', 'date_joined', 'user_permissions')


class UserEditForm(ModelForm, CssClassMixin):
    first_name = CharField(label=_("First name"))
    last_name = CharField(label=_("Last name"))

    class Meta:
        model = User
        exclude = ('password', 'is_staff', 'last_login', 'date_joined', 'user_permissions')


class UsernameForm(ModelForm, CssClassMixin):
    class Meta:
        model = User
        exclude = ('first_name', 'last_name', 'email', 'is_active','is_superuser', 'groups', 'password', 'is_staff', 'last_login', 'date_joined', 'user_permissions')


class ProfileForm(ModelForm, CssClassMixin):
    class Meta:
        model = Profile


class GroupForm(ModelForm, CssClassMixin):
    permissions = LocalizedModelMultipleChoiceField(queryset=Permission.objects.all())

    def __init__(self, *args, **kwargs):
        super(GroupForm, self).__init__(*args, **kwargs)
        if kwargs.get('instance', None) is not None:
            self.fields['permissions'].initial = [p.pk for p in kwargs['instance'].permissions.all()]

    class Meta:
        model = Group
        exclude = ('permissions',)


class UsersettingsForm(UserEditForm, CssClassMixin):
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email')


class UserImportForm(Form, CssClassMixin):
    csvfile = FileField(widget=FileInput(attrs={'size':'50'}), label=_("CSV File"))
    application_handling = ChoiceField(required=True, choices=USER_APPLICATION_IMPORT_OPTIONS, label=_("For existing applications"))
