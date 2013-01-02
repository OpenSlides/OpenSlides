#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the motion app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.utils.translation import ugettext_lazy as _

from openslides.utils.forms import CssClassMixin
from openslides.utils.person import PersonFormField, MultiplePersonFormField
from openslides.motion.models import Motion


class MotionForm(forms.Form, CssClassMixin):
    title = forms.CharField(widget=forms.TextInput(), label=_("Title"))
    text = forms.CharField(widget=forms.Textarea(), label=_("Text"))
    reason = forms.CharField(
        widget=forms.Textarea(), required=False, label=_("Reason"))


class MotionFormTrivialChanges(MotionForm):
    trivial_change = forms.BooleanField(
        required=False, label=_("Trivial change"),
        help_text=_("Trivial changes don't create a new version."))


class MotionManagerForm(forms.ModelForm, CssClassMixin):
    submitter = PersonFormField(label=_("Submitter"))

    class Meta:
        model = Motion
        exclude = ('number', 'status', 'permitted', 'log', 'supporter')


class MotionManagerFormSupporter(MotionManagerForm):
    # TODO: Do not show the submitter in the user-list
    supporter = MultiplePersonFormField(required=False, label=_("Supporters"))


class MotionImportForm(forms.Form, CssClassMixin):
    csvfile = forms.FileField(
        widget=forms.FileInput(attrs={'size': '50'}),
        label=_("CSV File"),
    )
    import_permitted = forms.BooleanField(
        required=False,
        label=_("Import motions with status \"authorized\""),
        help_text=_('Set the initial status for each motion to '
                    '"authorized"'),
    )


class ConfigForm(forms.Form, CssClassMixin):
    motion_min_supporters = forms.IntegerField(
        widget=forms.TextInput(attrs={'class': 'small-input'}),
        label=_("Number of (minimum) required supporters for a motion"),
        initial=4,
        min_value=0,
        max_value=8,
        help_text=_("Choose 0 to disable the supporting system"),
    )
    motion_preamble = forms.CharField(
        widget=forms.TextInput(),
        required=False,
        label=_("Motion preamble")
    )
    motion_pdf_ballot_papers_selection = forms.ChoiceField(
        widget=forms.Select(),
        required=False,
        label=_("Number of ballot papers (selection)"),
        choices=[
            ("NUMBER_OF_DELEGATES", _("Number of all delegates")),
            ("NUMBER_OF_ALL_PARTICIPANTS", _("Number of all participants")),
            ("CUSTOM_NUMBER", _("Use the following custom number")),
        ]
    )
    motion_pdf_ballot_papers_number = forms.IntegerField(
        widget=forms.TextInput(attrs={'class': 'small-input'}),
        required=False,
        min_value=1,
        label=_("Custom number of ballot papers")
    )
    motion_pdf_title = forms.CharField(
        widget=forms.TextInput(),
        required=False,
        label=_("Title for PDF document (all motions)")
    )
    motion_pdf_preamble = forms.CharField(
        widget=forms.Textarea(),
        required=False,
        label=_("Preamble text for PDF document (all motions)")
    )

    motion_allow_trivial_change = forms.BooleanField(
        label=_("Allow trivial changes"),
        help_text=_('Warning: Trivial changes undermine the motions '
                    'autorisation system.'),
        required=False,
    )
