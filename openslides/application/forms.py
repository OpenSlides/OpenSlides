#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the application app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import ModelForm, Form, CharField, Textarea, TextInput, ModelMultipleChoiceField, ModelChoiceField, BooleanField, FileField, FileInput, IntegerField, ChoiceField, Select
from django.contrib.auth.models import User

from utils.forms import CssClassMixin
from utils.translation_ext import ugettext as _
from application.models import Application


class UserModelChoiceField(ModelChoiceField):
    """
    Extend ModelChoiceField for users so that the choices are
    listed as 'first_name last_name' instead of just 'username'.
    """
    def label_from_instance(self, obj):
        return obj.get_full_name()


class UserModelMultipleChoiceField(ModelMultipleChoiceField):
    """
    Extend ModelMultipleChoiceField for users so that the choices are
    listed as 'first_name last_name' instead of just 'username'.
    """
    def label_from_instance(self, obj):
        return obj.get_full_name()


class ApplicationForm(Form, CssClassMixin):
    title = CharField(widget=TextInput(), label=_("Title"))
    text = CharField(widget=Textarea(), label=_("Text"))
    reason = CharField(widget=Textarea(), required=False, label=_("Reason"))
    trivial_change = BooleanField(required=False, label=_("Trivial change"), help_text=_("Trivial changes don't create a new version."))


class ApplicationManagerForm(ModelForm, CssClassMixin):
    users = User.objects.all().exclude(profile=None).order_by("first_name")
    submitter = UserModelChoiceField(queryset=users, label=_("Submitter"))
    supporter = UserModelMultipleChoiceField(queryset=users, required=False, label=_("Supporters"))

    class Meta:
        model = Application
        exclude = ('number', 'status', 'permitted', 'log')


class ApplicationImportForm(Form, CssClassMixin):
    csvfile = FileField(widget=FileInput(attrs={'size':'50'}), label=_("CSV File"))
    import_permitted = BooleanField(required=False, label=_("Import applications with status \"permitted\""), help_text=_("Set the initial status for each application to \"permitted\""))


class ConfigForm(Form, CssClassMixin):
    application_min_supporters = IntegerField(
        widget=TextInput(attrs={'class':'small-input'}),
        label=_("Number of (minimum) required supporters for a application"),
        initial=4,
        min_value=0,
        max_value=8,
    )
    application_preamble = CharField(
        widget=TextInput(),
        required=False,
        label=_("Application preamble")
    )
    application_pdf_ballot_papers_selection = ChoiceField(
        widget=Select(),
        required=False,
        label=_("Number of ballot papers (selection)"),
        choices=[
            ("NUMBER_OF_DELEGATES", _("Number of all delegates")),
            ("NUMBER_OF_ALL_PARTICIPANTS", _("Number of all participants")),
            ("CUSTOM_NUMBER", _("Use the following custom number")),
        ]
    )
    application_pdf_ballot_papers_number = IntegerField(
        widget=TextInput(attrs={'class':'small-input'}),
        required=False,
        min_value=1,
        label=_("Custom number of ballot papers")
    )
    application_pdf_title = CharField(
        widget=TextInput(),
        required=False,
        label=_("Title for PDF document (all applications)")
    )
    application_pdf_preamble = CharField(
        widget=Textarea(),
        required=False,
        label=_("Preamble text for PDF document (all applications)")
    )
