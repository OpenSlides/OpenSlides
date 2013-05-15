#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the participant app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.contrib import messages
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import ugettext as _, ugettext_lazy
from django.conf import settings

from openslides.utils.forms import CssClassMixin, LocalizedModelMultipleChoiceField
from openslides.participant.models import User, Group
from openslides.participant.api import get_registered_group


class UserCreateForm(CssClassMixin, forms.ModelForm):
    groups = LocalizedModelMultipleChoiceField(
        # Hide the built-in groups 'Anonymous' (pk=1) and 'Registered' (pk=2)
        queryset=Group.objects.exclude(pk=1).exclude(pk=2),
        label=ugettext_lazy('Groups'), required=False,
        help_text=ugettext_lazy('Hold down "Control", or "Command" on a Mac, to select more than one.'))

    class Meta:
        model = User
        fields = ('title', 'first_name', 'last_name', 'gender', 'email',
                  'groups', 'structure_level', 'committee', 'about_me', 'comment',
                  'is_active', 'default_password')


class UserUpdateForm(UserCreateForm):
    """
    Form to update an user. It raises a validation error, if a non-superuser
    user edits himself and removes the last group containing the permission
    to manage participants.
    """
    class Meta:
        model = User
        fields = ('username', 'title', 'first_name', 'last_name', 'gender', 'email',
                  'groups', 'structure_level', 'committee', 'about_me', 'comment',
                  'is_active', 'default_password')

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request')
        return super(UserUpdateForm, self).__init__(*args, **kwargs)

    def clean(self, *args, **kwargs):
        """
        Raises a validation error, if a non-superuser user edits himself
        and removes the last group containing the permission to manage participants.
        """
        # TODO: Check this in clean_groups
        if self.request.user == self.instance and not self.instance.is_superuser:
            protected_perm = Permission.objects.get(
                content_type=ContentType.objects.get(app_label='participant',
                                                     model='user'),
                codename='can_manage_participant')
            if not self.cleaned_data['groups'].filter(permissions__in=[protected_perm]).exists():
                error_msg = _('You can not remove the last group containing the permission to manage participants.')
                messages.error(self.request, error_msg)
                raise forms.ValidationError(error_msg)
        return super(UserUpdateForm, self).clean(*args, **kwargs)


class GroupForm(forms.ModelForm, CssClassMixin):
    permissions = LocalizedModelMultipleChoiceField(
        queryset=Permission.objects.all(), label=ugettext_lazy('Permissions'),
        required=False)
    users = forms.ModelMultipleChoiceField(
        queryset=User.objects.all(), label=ugettext_lazy('Participants'), required=False)

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

    class Meta:
        model = Group


class UsersettingsForm(forms.ModelForm, CssClassMixin):
    language = forms.ChoiceField(choices=settings.LANGUAGES)

    class Meta:
        model = User
        fields = ('username', 'title', 'first_name', 'last_name', 'gender', 'email',
                  'committee', 'about_me')


class UserImportForm(forms.Form, CssClassMixin):
    csvfile = forms.FileField(widget=forms.FileInput(attrs={'size': '50'}),
                              label=ugettext_lazy('CSV File'))
