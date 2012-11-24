#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the assignment app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.utils.translation import ugettext_lazy as _

from openslides.utils.forms import CssClassMixin
from openslides.utils.person import PersonFormField

from openslides.assignment.models import Assignment


class AssignmentForm(forms.ModelForm, CssClassMixin):
    posts = forms.IntegerField(
        min_value=1, initial=1, label=_("Number of available posts"))

    class Meta:
        model = Assignment
        exclude = ('status', 'elected')


class AssignmentRunForm(forms.Form, CssClassMixin):
    candidate = PersonFormField(
        widget=forms.Select(attrs={'class': 'medium-input'}),
        label=_("Nominate a participant"),
    )


class ConfigForm(forms.Form, CssClassMixin):
    assignment_publish_winner_results_only = forms.BooleanField(
        required=False,
        label=_("Only publish voting results for selected winners "
                "(Projector view only)"))
    assignment_pdf_ballot_papers_selection = forms.ChoiceField(
        widget=forms.Select(),
        required=False,
        label=_("Number of ballot papers (selection)"),
        choices=(
            ("NUMBER_OF_DELEGATES", _("Number of all delegates")),
            ("NUMBER_OF_ALL_PARTICIPANTS", _("Number of all participants")),
            ("CUSTOM_NUMBER", _("Use the following custom number"))))
    assignment_pdf_ballot_papers_number = forms.IntegerField(
        widget=forms.TextInput(attrs={'class': 'small-input'}),
        required=False,
        min_value=1,
        label=_("Custom number of ballot papers"))
    assignment_pdf_title = forms.CharField(
        widget=forms.TextInput(),
        required=False,
        label=_("Title for PDF document (all elections)"))
    assignment_pdf_preamble = forms.CharField(
        widget=forms.Textarea(),
        required=False,
        label=_("Preamble text for PDF document (all elections)"))
    assignment_poll_vote_values = forms.ChoiceField(
        widget=forms.Select(),
        required=False,
        label=_("Election method"),
        choices=(
            ("auto", _("Automatic assign of method.")),
            ("votes", _("Always one option per candidate.")),
            ("yesnoabstain", _("Always Yes-No-Abstain per candidate."))))
