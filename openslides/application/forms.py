#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the application app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.contrib.auth.models import User
from django.utils.translation import ugettext as _, ugettext_noop

from openslides.utils.forms import CssClassMixin
from openslides.application.models import Application


class UserModelChoiceField(forms.ModelChoiceField):
    """
    Extend ModelChoiceField for users so that the choices are
    listed as 'first_name last_name' instead of just 'username'.
    """
    def label_from_instance(self, obj):
        return obj.get_full_name()


class UserModelMultipleChoiceField(forms.ModelMultipleChoiceField):
    """
    Extend ModelMultipleChoiceField for users so that the choices are
    listed as 'first_name last_name' instead of just 'username'.
    """
    def label_from_instance(self, obj):
        return obj.get_full_name()


class ApplicationForm(forms.Form, CssClassMixin):
    title = forms.CharField(widget=forms.TextInput(), label=_("Title"))
    text = forms.CharField(widget=forms.Textarea(), label=_("Text"))
    reason = forms.CharField(widget=forms.Textarea(), required=False,
        label=_("Reason"))


class ApplicationFormTrivialChanges(ApplicationForm):
    trivial_change = forms.BooleanField(required=False,
        label=_("Trivial change"),
        help_text=_("Trivial changes don't create a new version."))


class ApplicationManagerForm(forms.ModelForm, CssClassMixin):
    submitter = UserModelChoiceField(
        queryset=User.objects.all().exclude(profile=None).
        order_by("first_name"),
        label=_("Submitter"),
    )

    class Meta:
        model = Application
        exclude = ('number', 'status', 'permitted', 'log', 'supporter')


class ApplicationManagerFormSupporter(ApplicationManagerForm):
    supporter = UserModelMultipleChoiceField(
        queryset=User.objects.all().exclude(profile=None).
        order_by("first_name"),
        required=False, label=_("Supporters"),
    )


class ApplicationImportForm(forms.Form, CssClassMixin):
    csvfile = forms.FileField(
        widget=forms.FileInput(attrs={'size':'50'}),
        label=_("CSV File"),
    )
    import_permitted = forms.BooleanField(
        required=False,
        label=_("Import applications with status \"permitted\""),
        help_text=_('Set the initial status for each application to \
        "permitted"'),
    )


class ConfigForm(forms.Form, CssClassMixin):
    application_min_supporters = forms.IntegerField(
        widget=forms.TextInput(attrs={'class':'small-input'}),
        label=_("Number of (minimum) required supporters for a application"),
        initial=4,
        min_value=0,
        max_value=8,
        help_text=_("Choose 0 to disable the supporting system"),
    )
    application_preamble = forms.CharField(
        widget=forms.TextInput(),
        required=False,
        label=_("Application preamble")
    )
    application_pdf_ballot_papers_selection = forms.ChoiceField(
        widget=forms.Select(),
        required=False,
        label=_("Number of ballot papers (selection)"),
        choices=[
            ("NUMBER_OF_DELEGATES", _("Number of all delegates")),
            ("NUMBER_OF_ALL_PARTICIPANTS", _("Number of all participants")),
            ("CUSTOM_NUMBER", _("Use the following custom number")),
        ]
    )
    application_pdf_ballot_papers_number = forms.IntegerField(
        widget=forms.TextInput(attrs={'class':'small-input'}),
        required=False,
        min_value=1,
        label=_("Custom number of ballot papers")
    )
    application_pdf_title = forms.CharField(
        widget=forms.TextInput(),
        required=False,
        label=_("Title for PDF document (all applications)")
    )
    application_pdf_preamble = forms.CharField(
        widget=forms.Textarea(),
        required=False,
        label=_("Preamble text for PDF document (all applications)")
    )

    application_allow_trivial_change = forms.BooleanField(
        label=_("Allow trivial changes"),
        help_text=_('Warning: Trivial changes undermine the application \
        permission system.'),
        required=False,
    )
