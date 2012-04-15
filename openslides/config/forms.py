#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.forms
    ~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the config app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import Form, CharField, TextInput, BooleanField, IntegerField, ChoiceField, Textarea, Select
from django.utils.translation import ugettext as _

from utils.forms import CssClassMixin
from models import config


class GeneralConfigForm(Form, CssClassMixin):
    event_name = CharField(widget=TextInput(),label=_("Event name"), max_length=30)
    event_description = CharField(widget=TextInput(),label=_("Short description of event"), max_length=100, required=False)
    event_date = CharField(widget=TextInput(), required=False, label=_("Event date"))
    event_location = CharField(widget=TextInput(), required=False, label=_("Event location"))
    event_organizer = CharField(widget=TextInput(), required=False, label=_("Event organizer"))
    system_enable_anonymous = BooleanField(required=False, label=_("Allow access for anonymous guest users") )
    frontpage_title = CharField(widget=TextInput(), required=False, label=_("Title") )
    frontpage_welcometext = CharField(widget=Textarea(), required=False, label=_("Welcome text") )