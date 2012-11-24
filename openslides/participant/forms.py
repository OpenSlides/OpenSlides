#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.contrib.auth.models import Permission
from django.utils.translation import ugettext_lazy as _

from openslides.utils.forms import (
    CssClassMixin, LocalizedModelMultipleChoiceField)

from openslides.participant.models import User, Group
from openslides.participant.api import get_or_create_registered_group


class UserCreateForm(forms.ModelForm, CssClassMixin):
    groups = forms.ModelMultipleChoiceField(
        queryset=Group.objects.exclude(name__iexact='anonymous'),
        label=_("Groups"), required=False)

    def __init__(self, *args, **kwargs):
        if kwargs.get('instance', None) is None:
            initial = kwargs.setdefault('initial', {})
            registered = get_or_create_registered_group()
            initial['groups'] = [registered.pk]
        super(UserCreateForm, self).__init__(*args, **kwargs)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'is_active', 'groups', 'structure_level',
                  'gender', 'type', 'committee', 'about_me', 'comment', 'default_password')


class UserUpdateForm(UserCreateForm):
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'is_active', 'groups',
                  'structure_level', 'gender', 'type', 'committee', 'about_me', 'comment',
                  'default_password')


class GroupForm(forms.ModelForm, CssClassMixin):
    permissions = LocalizedModelMultipleChoiceField(
        queryset=Permission.objects.all(), label=_("Permissions"),
        required=False)
    users = forms.ModelMultipleChoiceField(
        queryset=User.objects.all(), label=_("Participants"), required=False)

    def __init__(self, *args, **kwargs):
        # Initial users
        if kwargs.get('instance', None) is not None:
            initial = kwargs.setdefault('initial', {})
            initial['users'] = [django_user.user.pk for django_user in kwargs['instance'].user_set.all()]

        super(GroupForm, self).__init__(*args, **kwargs)

    def save(self, commit=True):
        instance = forms.ModelForm.save(self, False)

        old_save_m2m = self.save_m2m

        def save_m2m():
            old_save_m2m()

            instance.user_set.clear()
            for user in self.cleaned_data['users']:
                instance.user_set.add(user)
        self.save_m2m = save_m2m

        if commit:
            instance.save()
            self.save_m2m()

        return instance

    def clean_name(self):
        # Do not allow to change the name "anonymous" or give another group
        # this name
        data = self.cleaned_data['name']
        if self.instance.name.lower() in ['anonymous', 'registered']:
            # Editing the anonymous-user
            if self.instance.name.lower() != data.lower():
                raise forms.ValidationError(
                    _('You can not edit the name for this group.'))
        else:
            if data.lower() in ['anonymous', 'registered']:
                raise forms.ValidationError(
                    _('Group name "%s" is reserved for internal use.') % data)
        return data

    class Meta:
        model = Group


class UsersettingsForm(forms.ModelForm, CssClassMixin):
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'gender', 'email', 'committee', 'about_me')


class UserImportForm(forms.Form, CssClassMixin):
    csvfile = forms.FileField(widget=forms.FileInput(attrs={'size': '50'}),
                              label=_("CSV File"))


class ConfigForm(forms.Form, CssClassMixin):
    participant_pdf_system_url = forms.CharField(
        widget=forms.TextInput(),
        required=False,
        label=_("System URL"),
        help_text=_("Printed in PDF of first time passwords only."))
    participant_pdf_welcometext = forms.CharField(
        widget=forms.Textarea(),
        required=False,
        label=_("Welcome text"),
        help_text=_("Printed in PDF of first time passwords only."))
    participant_sort_users_by_first_name = forms.BooleanField(
        required=False,
        label=_("Sort participants by first name"),
        help_text=_("Disable for sorting by last name"))
