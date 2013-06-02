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
from django.utils.translation import ugettext as _, ugettext_lazy

from openslides.config.api import config
from openslides.utils.forms import CssClassMixin
from openslides.utils.forms import CleanHtmlFormMixin
from openslides.utils.person import PersonFormField, MultiplePersonFormField
from .models import Motion, Category, Workflow


class BaseMotionForm(CleanHtmlFormMixin, CssClassMixin, forms.ModelForm):
    """
    Base FormClass for a Motion.

    For it's own, it append the version data to the fields.

    The class can be mixed with the following mixins to add fields for the
    submitter, supporters etc.
    """
    clean_html_fields = ('text', 'reason')

    title = forms.CharField(widget=forms.TextInput(), label=ugettext_lazy("Title"))
    """
    Title of the motion. Will be saved in a MotionVersion object.
    """

    text = forms.CharField(widget=forms.Textarea(), label=ugettext_lazy("Text"))
    """
    Text of the motion. Will be saved in a MotionVersion object.
    """

    reason = forms.CharField(
        widget=forms.Textarea(), required=False, label=ugettext_lazy("Reason"))
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
        else:
            self.initial['text'] = config['motion_preamble']
        super(BaseMotionForm, self).__init__(*args, **kwargs)


class MotionSubmitterMixin(forms.ModelForm):
    """Mixin to append the submitter field to a MotionForm."""

    submitter = MultiplePersonFormField(label=ugettext_lazy("Submitter"),
                                        required=False)
    """Submitter of the motion. Can be one or more persons."""

    def __init__(self, *args, **kwargs):
        """Fill in the submitter of the motion as default value."""
        if self.motion is not None:
            submitter = [submitter.person.person_id for submitter in self.motion.submitter.all()]
            self.initial['submitter'] = submitter
        super(MotionSubmitterMixin, self).__init__(*args, **kwargs)


class MotionSupporterMixin(forms.ModelForm):
    """Mixin to append the supporter field to a Motionform."""

    supporter = MultiplePersonFormField(required=False, label=ugettext_lazy("Supporters"))
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
        required=False, label=ugettext_lazy("Don't create a new version"),
        help_text=ugettext_lazy("Don't create a new version. Useful e.g. for trivial changes."))
    """BooleanField to decide, if a new version will be created, or the
    last_version will be used."""


# TODO: Add category and identifier to the form as normal fields (the django way),
# not as 'new' field from 'new' forms.

class MotionCategoryMixin(forms.ModelForm):
    """
    Mixin to let the user choose the category for the motion.
    """

    category = forms.ModelChoiceField(queryset=Category.objects.all(), required=False, label=ugettext_lazy("Category"))
    """
    Category of the motion.
    """

    def __init__(self, *args, **kwargs):
        """
        Fill in the category of the motion as default value.
        """
        if self.motion is not None:
            category = self.motion.category
            self.initial['category'] = category
        super(MotionCategoryMixin, self).__init__(*args, **kwargs)


class MotionIdentifierMixin(forms.ModelForm):
    """
    Mixin to let the user choose the identifier for the motion.
    """

    identifier = forms.CharField(required=False, label=ugettext_lazy('Identifier'))

    class Meta:
        model = Motion
        fields = ('identifier',)


class MotionSetWorkflowMixin(forms.ModelForm):
    """
    Mixin to let the user change the workflow of the motion. When he does
    so, the motion's state is reset.
    """

    set_workflow = forms.ModelChoiceField(
        queryset=Workflow.objects.all(),
        required=False,
        label=ugettext_lazy('Workflow'),
        help_text=ugettext_lazy('Set a specific workflow to switch to it. If you do so, the state of the motion will be reset.'))


class MotionImportForm(CssClassMixin, forms.Form):
    """
    Form for motion import via csv file.
    """
    csvfile = forms.FileField(
        widget=forms.FileInput(attrs={'size': '50'}),
        label=ugettext_lazy('CSV File'),
        help_text=ugettext_lazy('The file has to be encoded in UTF-8.'))
    """
    CSV filt with import data.
    """

    override = forms.BooleanField(
        required=False,
        label=ugettext_lazy('Override existing motions with the same identifier'),
        help_text=ugettext_lazy('If this is active, every motion with the same identifier as in your csv file will be overridden.'))
    """
    Flag to decide whether existing motions (according to the identifier)
    should be overridden.
    """

    default_submitter = PersonFormField(
        required=True,
        label=ugettext_lazy('Default submitter'),
        help_text=ugettext_lazy('This person is used as submitter for any line of your csv file which does not contain valid submitter data.'))
    """
    Person which is used as submitter, if the line of the csv file does
    not contain valid submitter data.
    """
