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

from openslides.participant.models import OpenSlidesUser, OpenSlidesGroup


class UserCreateForm(forms.ModelForm, CssClassMixin):
    first_name = forms.CharField(label=_("First name"))
    last_name = forms.CharField(label=_("Last name"))
    groups = forms.ModelMultipleChoiceField(
        queryset=OpenSlidesGroup.objects.all(), label=_("User groups"),
        required=False)
    is_active = forms.BooleanField(
        label=_("Active"), required=False, initial=True)

    class Meta:
        model = OpenSlidesUser
        fields = ('first_name', 'last_name', 'is_active', 'groups', 'category',
                  'gender', 'type', 'committee', 'comment', 'firstpassword')


class UserUpdateForm(UserCreateForm):
    class Meta:
        model = OpenSlidesUser
        fields = ('username', 'first_name', 'last_name', 'is_active', 'groups',
                  'category', 'gender', 'type', 'committee', 'comment',
                  'firstpassword')


class GroupForm(forms.ModelForm, CssClassMixin):
    permissions = LocalizedModelMultipleChoiceField(
        queryset=Permission.objects.all(), label=_("Persmissions"),
        required=False)

    def __init__(self, *args, **kwargs):
        super(GroupForm, self).__init__(*args, **kwargs)
        if kwargs.get('instance', None) is not None:
            self.fields['permissions'].initial = (
                [p.pk for p in kwargs['instance'].permissions.all()])

    def clean_name(self):
        data = self.cleaned_data['name']
        if self.instance.name.lower() == 'anonymous':
            # Editing the anonymous-user
            if self.instance.name.lower() != data.lower():
                raise forms.ValidationError(
                    _('You can not edit the name for the anonymous user'))
        else:
            if data.lower() == 'anonymous':
                raise forms.ValidationError(
                    _('Group name "%s" is reserved for internal use.') % data)
        return data

    class Meta:
        model = OpenSlidesGroup


class UsersettingsForm(forms.ModelForm, CssClassMixin):
    class Meta:
        model = OpenSlidesUser
        fields = ('username', 'first_name', 'last_name', 'email')


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
