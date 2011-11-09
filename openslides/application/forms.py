#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the application app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import ModelForm, Form, CharField, Textarea, TextInput, ModelMultipleChoiceField, ModelChoiceField, BooleanField, FileField, FileInput
from django.contrib.auth.models import User
from django.utils.translation import ugettext as _

from openslides.application.models import Application


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


class ApplicationForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'

    title = CharField(widget=TextInput(), label=_("Title"))
    text = CharField(widget=Textarea(), label=_("Text"))
    reason = CharField(widget=Textarea(), required=False, label=_("Reason"))
    trivial_change = BooleanField(required=False, label=_("Trivial change"), help_text=_("Trivial changes don't create a new version."))

class ApplicationManagerForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'

    users = User.objects.all().exclude(profile=None).order_by("first_name")
    submitter = UserModelChoiceField(queryset=users, label=_("Submitter"))
    supporter = UserModelMultipleChoiceField(queryset=users, required=False, label=_("Supporters"))

    class Meta:
        model = Application
        exclude = ('number', 'status', 'permitted', 'log')

class ApplicationImportForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'

    csvfile = FileField(widget=FileInput(attrs={'size':'50'}), label=_("CSV File"))
