# -*- coding: utf-8 -*-

from django import forms
from django.conf import settings
from django.contrib.auth.models import Permission
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from openslides.config.api import config
from openslides.utils.forms import (CssClassMixin,
                                    LocalizedModelMultipleChoiceField)

from .models import get_protected_perm, Group, User


class UserCreateForm(CssClassMixin, forms.ModelForm):
    groups = LocalizedModelMultipleChoiceField(
        # Hide the built-in groups 'Anonymous' (pk=1) and 'Registered' (pk=2)
        queryset=Group.objects.exclude(pk=1).exclude(pk=2),
        label=ugettext_lazy('Groups'), required=False)

    class Meta:
        model = User
        fields = ('title', 'first_name', 'last_name', 'gender', 'email',
                  'groups', 'structure_level', 'committee', 'about_me', 'comment',
                  'is_active', 'default_password')

    def clean(self, *args, **kwargs):
        """
        Ensures that a user has either a first name or a last name.
        """
        cleaned_data = super(UserCreateForm, self).clean(*args, **kwargs)
        if not cleaned_data['first_name'] and not cleaned_data['last_name']:
            error_msg = _('First name and last name can not both be empty.')
            raise forms.ValidationError(error_msg)
        return cleaned_data


class UserMultipleCreateForm(forms.Form):
    participants_block = forms.CharField(
        widget=forms.Textarea,
        label=ugettext_lazy('Participants'),
        help_text=ugettext_lazy('Use one line per participant for its name (first name and last name).'))


class UserUpdateForm(UserCreateForm):
    """
    Form to update an user. It raises a validation error, if a non-superuser
    user edits himself and removes the last group containing the permission
    to manage participants.
    """
    user_name = forms.CharField(label=ugettext_lazy('Username'))
    """
    Field to save the username.

    The field username (without the underscore) from the UserModel does not
    allow whitespaces and umlauts.
    """

    class Meta:
        model = User
        fields = ('user_name', 'title', 'first_name', 'last_name', 'gender', 'email',
                  'groups', 'structure_level', 'committee', 'about_me', 'comment',
                  'is_active', 'default_password')

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request')
        kwargs['initial']['user_name'] = kwargs['instance'].username
        return super(UserUpdateForm, self).__init__(*args, **kwargs)

    def clean(self, *args, **kwargs):
        """
        Raises a validation error if a non-superuser user edits himself
        and removes the last group containing the permission to manage participants.
        """
        # TODO: Check this in clean_groups
        if (self.request.user == self.instance and
                not self.instance.is_superuser and
                not self.cleaned_data['groups'].filter(permissions__in=[get_protected_perm()]).exists()):
            error_msg = _('You can not remove the last group containing the permission to manage participants.')
            raise forms.ValidationError(error_msg)
        return super(UserUpdateForm, self).clean(*args, **kwargs)


class GroupForm(forms.ModelForm, CssClassMixin):
    permissions = LocalizedModelMultipleChoiceField(
        queryset=Permission.objects.all(), label=ugettext_lazy('Permissions'), required=False,
        widget=forms.SelectMultiple(attrs={'class': 'dont_use_bsmselect'}))
    users = forms.ModelMultipleChoiceField(
        queryset=User.objects.all(), label=ugettext_lazy('Participants'), required=False,
        widget=forms.SelectMultiple(attrs={'class': 'dont_use_bsmselect'}))

    class Meta:
        model = Group

    def __init__(self, *args, **kwargs):
        # Take request argument
        self.request = kwargs.pop('request', None)
        # Initial users
        if kwargs.get('instance', None) is not None:
            initial = kwargs.setdefault('initial', {})
            initial['users'] = [django_user.user.pk for django_user in kwargs['instance'].user_set.all()]

        super(GroupForm, self).__init__(*args, **kwargs)
        if config['participant_sort_users_by_first_name']:
            self.fields['users'].queryset = self.fields['users'].queryset.order_by('first_name')

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

    def clean(self, *args, **kwargs):
        """
        Raises a validation error if a non-superuser user removes himself
        from the last group containing the permission to manage participants.

        Raises also a validation error if a non-superuser removes his last
        permission to manage participants from the (last) group.
        """
        # TODO: Check this in clean_users or clean_permissions
        if (self.request and
                not self.request.user.is_superuser and
                self.request.user not in self.cleaned_data['users'] and
                not Group.objects.exclude(pk=self.instance.pk).filter(
                    permissions__in=[get_protected_perm()],
                    user__pk=self.request.user.pk).exists()):
            error_msg = _('You can not remove yourself from the last group containing the permission to manage participants.')
            raise forms.ValidationError(error_msg)
        if (self.request and
                not self.request.user.is_superuser and
                not get_protected_perm() in self.cleaned_data['permissions'] and
                not Group.objects.exclude(pk=self.instance.pk).filter(
                    permissions__in=[get_protected_perm()],
                    user__pk=self.request.user.pk).exists()):
            error_msg = _('You can not remove the permission to manage participants from the last group you are in.')
            raise forms.ValidationError(error_msg)
        return super(GroupForm, self).clean(*args, **kwargs)


class UsersettingsForm(CssClassMixin, forms.ModelForm):
    user_name = forms.CharField(label=ugettext_lazy('Username'))
    """
    Field to save the username.

    The field username (without the underscore) from the UserModel does not
    allow whitespaces and umlauts.
    """

    language = forms.ChoiceField(
        choices=settings.LANGUAGES, label=ugettext_lazy('Language'))

    def __init__(self, *args, **kwargs):
        kwargs['initial'] = kwargs.get('initial', {})
        kwargs['initial']['user_name'] = kwargs['instance'].username
        return super(UsersettingsForm, self).__init__(*args, **kwargs)

    class Meta:
        model = User
        fields = ('user_name', 'title', 'first_name', 'last_name', 'gender', 'email',
                  'committee', 'about_me')
