from django import forms
from django.conf import settings
from django.utils.translation import ugettext as _, ugettext_lazy

from openslides.config.api import config
from openslides.utils.forms import (CssClassMixin,
                                    LocalizedModelMultipleChoiceField)

from .models import Group, Permission, User
from .api import get_protected_perm


class UserCreateForm(CssClassMixin, forms.ModelForm):
    groups = LocalizedModelMultipleChoiceField(
        # Hide the built-in groups 'Anonymous' (pk=1) and 'Registered' (pk=2)
        queryset=Group.objects.exclude(pk__in=[1, 2]),
        label=ugettext_lazy('Groups'), required=False)

    class Meta:
        model = User
        fields = ('title', 'first_name', 'last_name', 'groups',
                  'structure_level', 'about_me', 'comment', 'is_active',
                  'default_password')

    def clean(self, *args, **kwargs):
        """
        Ensures that a user has either a first name or a last name.
        """
        cleaned_data = super(UserCreateForm, self).clean(*args, **kwargs)
        if not (cleaned_data['first_name'] or cleaned_data['last_name']):
            error_msg = _('First name and last name can not both be empty.')
            raise forms.ValidationError(error_msg)
        return cleaned_data


class UserMultipleCreateForm(forms.Form):
    users_block = forms.CharField(
        widget=forms.Textarea,
        label=ugettext_lazy('Users'),
        help_text=ugettext_lazy('Use one line per user for its name '
                                '(first name and last name).'))


class UserUpdateForm(UserCreateForm):
    """
    Form to update an user. It raises a validation error, if a non-superuser
    user edits himself and removes the last group containing the permission
    to manage users.
    """

    class Meta:
        model = User
        fields = ('username', 'title', 'first_name', 'last_name',
                  'groups', 'structure_level', 'about_me', 'comment',
                  'is_active', 'default_password')

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request')
        return super().__init__(*args, **kwargs)

    def clean(self, *args, **kwargs):
        """
        Raises a validation error if a non-superuser user edits himself
        and removes the last group containing the permission to manage users.
        """
        # TODO: Check this in clean_groups
        if (self.request.user == self.instance and
                not self.instance.is_superuser and
                not self.cleaned_data['groups'].filter(permissions__in=[get_protected_perm()]).exists()):
            error_msg = _('You can not remove the last group containing the permission to manage users.')
            raise forms.ValidationError(error_msg)
        return super().clean(*args, **kwargs)


class GroupForm(CssClassMixin, forms.ModelForm):
    permissions = LocalizedModelMultipleChoiceField(
        queryset=Permission.objects.all(), label=ugettext_lazy('Permissions'), required=False,
        widget=forms.SelectMultiple(attrs={'class': 'dont_use_bsmselect'}))
    users = forms.ModelMultipleChoiceField(
        queryset=User.objects.all(), label=ugettext_lazy('Participants'), required=False,
        widget=forms.SelectMultiple(attrs={'class': 'dont_use_bsmselect'}))

    class Meta:
        model = Group
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        # Take request argument
        self.request = kwargs.pop('request', None)
        # Initial users
        if kwargs.get('instance', None) is not None:
            initial = kwargs.setdefault('initial', {})
            initial['users'] = kwargs['instance'].user_set.all()

        super().__init__(*args, **kwargs)
        if config['users_sort_users_by_first_name']:
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
        from the last group containing the permission to manage users.

        Raises also a validation error if a non-superuser removes his last
        permission to manage users from the (last) group.
        """
        # TODO: Check this in clean_users or clean_permissions
        if (self.request and
                not self.request.user.is_superuser and
                self.request.user not in self.cleaned_data['users'] and
                not Group.objects.exclude(pk=self.instance.pk).filter(
                    permissions__in=[get_protected_perm()],
                    user__pk=self.request.user.pk).exists()):
            error_msg = _('You can not remove yourself from the last group containing the permission to manage users.')
            raise forms.ValidationError(error_msg)

        if (self.request and
                not self.request.user.is_superuser and
                not get_protected_perm() in self.cleaned_data['permissions'] and
                not Group.objects.exclude(pk=self.instance.pk).filter(
                    permissions__in=[get_protected_perm()],
                    user__pk=self.request.user.pk).exists()):
            error_msg = _('You can not remove the permission to manage users from the last group you are in.')
            raise forms.ValidationError(error_msg)
        return super(GroupForm, self).clean(*args, **kwargs)


class UsersettingsForm(CssClassMixin, forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'title', 'first_name', 'last_name', 'about_me')

    language = forms.ChoiceField(
        choices=settings.LANGUAGES, label=ugettext_lazy('Language'))
