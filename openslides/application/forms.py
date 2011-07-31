#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the application app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import ModelForm, Form, CharField, Textarea, TextInput
from django.utils.translation import ugettext as _

from openslides.application.models import Application


class ApplicationForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'

    title = CharField(widget=TextInput(), label=_("Title"))
    text = CharField(widget=Textarea(), label=_("Text"))
    reason = CharField(widget=Textarea(), required=False, label=_("Reason"))


class ApplicationManagerForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'

    class Meta:
        model = Application
        exclude = ('number', 'status', 'permitted', 'log')
