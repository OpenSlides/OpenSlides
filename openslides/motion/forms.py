#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.forms
    ~~~~~~~~~~~~~~~~~~~~~~~

    Defines the DjangoForms for the motion app.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.utils.translation import ugettext as _

from openslides.utils.forms import CssClassMixin
from openslides.utils.person import PersonFormField, MultiplePersonFormField
from .models import Motion, Workflow


class BaseMotionForm(forms.ModelForm, CssClassMixin):
    """Base FormClass for a Motion.

    For it's own, it append the version data to the fields.

    The class can be mixed with the following mixins to add fields for the
    submitter, supporters etc.
    """

    title = forms.CharField(widget=forms.TextInput(), label=_("Title"))
    """Title of the motion. Will be saved in a MotionVersion object."""

    text = forms.CharField(widget=forms.Textarea(), label=_("Text"))
    """Text of the motion. Will be saved in a MotionVersion object."""

    reason = forms.CharField(
        widget=forms.Textarea(), required=False, label=_("Reason"))
    """Reason of the motion. will be saved in a MotionVersion object."""

    class Meta:
        model = Motion
        fields = ()

    def __init__(self, *args, **kwargs):
        """Fill the FormFields releated to the version data with initial data."""
        self.motion = kwargs.get('instance', None)
        self.initial = kwargs.setdefault('initial', {})
        if self.motion is not None:
            self.initial['title'] = self.motion.title
            self.initial['text'] = self.motion.text
            self.initial['reason'] = self.motion.reason
        super(BaseMotionForm, self).__init__(*args, **kwargs)


class MotionSubmitterMixin(forms.ModelForm):
    """Mixin to append the submitter field to a MotionForm."""

    submitter = MultiplePersonFormField(label=_("Submitter"))
    """Submitter of the motion. Can be one or more persons."""

    def __init__(self, *args, **kwargs):
        """Fill in the submitter of the motion as default value."""
        if self.motion is not None:
            submitter = [submitter.person.person_id for submitter in self.motion.submitter.all()]
            self.initial['submitter'] = submitter
        super(MotionSubmitterMixin, self).__init__(*args, **kwargs)


class MotionSupporterMixin(forms.ModelForm):
    """Mixin to append the supporter field to a Motionform."""

    supporter = MultiplePersonFormField(required=False, label=_("Supporters"))
    """Supporter of the motion. Can be one or more persons."""

    def __init__(self, *args, **kwargs):
        """Fill in the supporter of the motions as default value."""
        if self.motion is not None:
            supporter = [supporter.person.person_id for supporter in self.motion.supporter.all()]
            self.initial['supporter'] = supporter
        super(MotionSupporterMixin, self).__init__(*args, **kwargs)


class MotionDisableVersioningMixin(forms.ModelForm):
    """Mixin to add the option to the form to choose to disable versioning."""

    disable_versioning = forms.BooleanField(
        required=False, label=_("Don't create a new version"),
        help_text=_("Don't create a new version. Useful e. g. for trivial changes."))
    """BooleanField to decide, if a new version will be created, or the
    last_version will be used."""


class ConfigForm(CssClassMixin, forms.Form):
    """Form for the configuration tab of OpenSlides."""
    motion_min_supporters = forms.IntegerField(
        widget=forms.TextInput(attrs={'class': 'small-input'}),
        label=_("Number of (minimum) required supporters for a motion"),
        initial=4, min_value=0, max_value=8,
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

    motion_allow_disable_versioning = forms.BooleanField(
        label=_("Allow to disable versioning"),
        required=False,
    )

    motion_workflow = forms.ChoiceField(
        widget=forms.Select(),
        label=_("Workflow of new motions"),
        required=True,
        choices=[(workflow.pk, workflow.name) for workflow in Workflow.objects.all()])
