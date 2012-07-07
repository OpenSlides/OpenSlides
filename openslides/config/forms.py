#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.forms
    ~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the config app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms

from utils.forms import CssClassMixin
from models import config
from utils.translation_ext import ugettext as _


class GeneralConfigForm(forms.Form, CssClassMixin):
    event_name = forms.CharField(
        widget=forms.TextInput(),
        label=_("Event name"),
        max_length=30,
    )

    event_description = forms.CharField(
        widget=forms.TextInput(),
        label=_("Short description of event"),
        required=False,
        max_length=100,

    )

    event_date = forms.CharField(
        widget=forms.TextInput(),
        label=_("Event date"),
        required=False,
    )

    event_location = forms.CharField(
        widget=forms.TextInput(),
        label=_("Event location"),
        required=False,
    )

    event_organizer = forms.CharField(
        widget=forms.TextInput(),
        label=_("Event organizer"),
        required=False,
    )

    system_enable_anonymous = forms.BooleanField(
        label=_("Allow access for anonymous guest users"),
        required=False,
    )

    frontpage_title = forms.CharField(
        widget=forms.TextInput(),
        label=_("Title"),
        required=False,
    )

    frontpage_welcometext = forms.CharField(
        widget=forms.Textarea(),
        label=_("Welcome text"),
        required=False,
    )
