#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.system.forms
    ~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the system app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import Form, CharField, TextInput, BooleanField, IntegerField, ChoiceField, Textarea, Select
from django.utils.translation import ugettext as _

from utils.forms import CssClassMixin
from system import config


class SystemConfigForm(Form, CssClassMixin):
    system_url = CharField(widget=TextInput(), required=False, label=_("System URL"))
    system_welcometext = CharField(widget=Textarea(), required=False, label=_("Welcome text (for password PDF)"))
    system_enable_anonymous = BooleanField(required=False, label=_("Access for anonymous / guest users"), help_text=_("Allow access for guest users"))


class EventConfigForm(Form, CssClassMixin):
    event_name = CharField(widget=TextInput(),label=_("Event name"), max_length=30)
    event_description = CharField(widget=TextInput(),label=_("Short description of event"), max_length=100, required=False)
    event_date = CharField(widget=TextInput(), required=False, label=_("Event date"))
    event_location = CharField(widget=TextInput(), required=False, label=_("Event location"))
    event_organizer = CharField(widget=TextInput(), required=False, label=_("Event organizer"))
