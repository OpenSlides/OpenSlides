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
from openslides.utils.forms import CleanHtmlFormMixin
from openslides.utils.person import PersonFormField, MultiplePersonFormField
from .models import Motion, Category


class BaseMotionForm(CleanHtmlFormMixin, CssClassMixin, forms.ModelForm):
    """
    Base FormClass for a Motion.

    For it's own, it append the version data to the fields.

    The class can be mixed with the following mixins to add fields for the
    submitter, supporters etc.
    """
    clean_html_fields = ('text', 'reason')

    title = forms.CharField(widget=forms.TextInput(), label=_("Title"))
    """
    Title of the motion. Will be saved in a MotionVersion object.
    """

    text = forms.CharField(widget=forms.Textarea(), label=_("Text"))
    """
    Text of the motion. Will be saved in a MotionVersion object.
    """

    reason = forms.CharField(
        widget=forms.Textarea(), required=False, label=_("Reason"))
    """
    Reason of the motion. will be saved in a MotionVersion object.
    """

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


class MotionCategoryMixin(forms.ModelForm):
    """Mixin to let the user choose the category for the motion."""

    category = forms.ModelChoiceField(queryset=Category.objects.all(), required=False)


class MotionIdentifierMixin(forms.ModelForm):
    """Mixin to let the user choose the identifier for the motion."""

    identifier = forms.CharField(required=False)
