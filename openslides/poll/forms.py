#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.forms
    ~~~~~~~~~~~~~~~~~~~~~

    Forms for the poll app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import Form, ModelForm, TextInput, Textarea, IntegerField, CharField, DecimalField, ModelChoiceField
from django.utils.translation import ugettext as _
from poll.models import Poll, Option
from application.models import Application


class PollForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'

    votescast = IntegerField(required=False, min_value=-2, widget=TextInput(attrs={'class':'small-input'}),label=_("Votes cast"))
    invalid = IntegerField(required=False, min_value=-2, widget=TextInput(attrs={'class': 'small-input'}), label=_("Invalid"))

    class Meta:
        model = Poll

class OptionForm(ModelForm):
    error_css_class = 'error'
    required_css_class = 'required'

    voteyes = IntegerField(required=False, min_value=0,widget=TextInput(attrs={'class':'small-input'}),label=_("Votes in favour"))
    voteno = IntegerField(required=False, min_value=0,widget=TextInput(attrs={'class':'small-input'}),label=_("Votes against"))
    voteundesided = IntegerField(required=False, min_value=0,widget=TextInput(attrs={'class':'small-input'}),label=_("Abstention"))

    class Meta:
        model = Option


class OptionResultForm(Form):
    error_css_class = 'error'
    required_css_class = 'required'

    yes = IntegerField(min_value=-2, widget=TextInput(attrs={'class': 'small-input'}), label=_("Yes"))
    no = IntegerField(min_value=-2, required=False, widget=TextInput(attrs={'class': 'small-input'}), label=_("No"))
    undesided = IntegerField(min_value=-2, required=False, widget=TextInput(attrs={'class': 'small-input'}), label=_("Abstention"))
