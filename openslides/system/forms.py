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
from system.api import config_get

class SystemConfigForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'
    
    #user_registration = BooleanField(label=_("User registration"), required=False)
    system_url = CharField(widget=TextInput(), required=False, label=_("System URL"))
    system_welcometext = CharField(widget=Textarea(), required=False, label=_("Welcome text (for password PDF)"))
    system_enable_anonymous = BooleanField(required=False, label=_("Access for anonymous / guest users"), help_text=_("Allow access for guest users"))
    
class EventConfigForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'
    
    event_name = CharField(widget=TextInput(),label=_("Event name"), max_length=30)
    event_description = CharField(widget=TextInput(),label=_("Short description of event"), max_length=100, required=False)
    event_date = CharField(widget=TextInput(), required=False, label=_("Event date"))
    event_location = CharField(widget=TextInput(), required=False, label=_("Event location"))
    event_organizer = CharField(widget=TextInput(), required=False, label=_("Event organizer"))

class AgendaConfigForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'

    agenda_countdown_time = IntegerField(widget=TextInput(attrs={'class':'small-input'}),label=_("Countdown (in seconds)"),initial=60, min_value=0)

class ApplicationConfigForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'

    application_min_supporters = IntegerField(widget=TextInput(attrs={'class':'small-input'}),label=_("Number of (minimum) required supporters for a application"),initial=4, min_value=0, max_value=8)
    application_preamble = CharField(widget=TextInput(), required=False, label=_("Application preamble"))
    application_pdf_ballot_papers_selection = ChoiceField(widget=Select(), required=False, label=_("Number of ballot papers (selection)"), choices=[("1", _("Number of all delegates")),("2", _("Number of all participants")),("0", _("Use the following custum number"))])
    application_pdf_ballot_papers_number = IntegerField(widget=TextInput(attrs={'class':'small-input'}), required=False, min_value=1, label=_("Custom number of ballot papers"))
    application_pdf_title = CharField(widget=TextInput(), required=False, label=_("Title for PDF document (all applications)"))
    application_pdf_preamble = CharField(widget=Textarea(), required=False, label=_("Preamble text for PDF document (all applications)"))

class AssignmentConfigForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'

    assignment_pdf_title = CharField(widget=TextInput(), required=False, label=_("Title for PDF document (all elections)"))
    assignment_pdf_preamble = CharField(widget=Textarea(), required=False, label=_("Preamble text for PDF document (all elections)"))
    assignment_pdf_ballot_papers_selection = ChoiceField(widget=Select(), required=False, label=_("Number of ballot papers (selection)"), choices=[("1", _("Number of all delegates")),("2", _("Number of all participants")),("0", _("Use the following custum number"))])
    assignment_pdf_ballot_papers_number = IntegerField(widget=TextInput(attrs={'class':'small-input'}), required=False, min_value=1, label=_("Custom number of ballot papers"))

    
