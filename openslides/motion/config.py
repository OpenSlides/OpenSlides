# -*- coding: utf-8 -*-

from django import forms
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import ConfigPage, ConfigVariable

from .models import Workflow


def get_motion_config_page(sender, **kwargs):
    """
    Motion config variables.
    """
    motion_stop_submitting = ConfigVariable(
        name='motion_stop_submitting',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Stop submitting new motions by non-staff users'),
            required=False))
    motion_min_supporters = ConfigVariable(
        name='motion_min_supporters',
        default_value=0,
        form_field=forms.IntegerField(
            widget=forms.TextInput(attrs={'class': 'small-input'}),
            label=ugettext_lazy('Number of (minimum) required supporters for a motion'),
            min_value=0,
            help_text=ugettext_lazy('Choose 0 to disable the supporting system.')))
    motion_remove_supporters = ConfigVariable(
        name='motion_remove_supporters',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Remove all supporters of a motion if a submitter edits his motion in early state'),
            required=False))
    motion_preamble = ConfigVariable(
        name='motion_preamble',
        default_value=_('The assembly may decide,'),
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=ugettext_lazy('Motion preamble')))
    motion_pdf_ballot_papers_selection = ConfigVariable(
        name='motion_pdf_ballot_papers_selection',
        default_value='CUSTOM_NUMBER',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=False,
            label=ugettext_lazy('Number of ballot papers (selection)'),
            choices=[
                ('NUMBER_OF_DELEGATES', ugettext_lazy('Number of all delegates')),
                ('NUMBER_OF_ALL_PARTICIPANTS', ugettext_lazy('Number of all participants')),
                ('CUSTOM_NUMBER', ugettext_lazy("Use the following custom number"))]))
    motion_pdf_ballot_papers_number = ConfigVariable(
        name='motion_pdf_ballot_papers_number',
        default_value=8,
        form_field=forms.IntegerField(
            widget=forms.TextInput(attrs={'class': 'small-input'}),
            required=False,
            min_value=1,
            label=ugettext_lazy('Custom number of ballot papers')))
    motion_pdf_title = ConfigVariable(
        name='motion_pdf_title',
        default_value=_('Motions'),
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=ugettext_lazy('Title for PDF document (all motions)')))
    motion_pdf_preamble = ConfigVariable(
        name='motion_pdf_preamble',
        default_value='',
        form_field=forms.CharField(
            widget=forms.Textarea(),
            required=False,
            label=ugettext_lazy('Preamble text for PDF document (all motions)')))
    motion_pdf_paragraph_numbering = ConfigVariable(
        name='motion_pdf_paragraph_numbering',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Show paragraph numbering (only in PDF)'),
            required=False))
    motion_allow_disable_versioning = ConfigVariable(
        name='motion_allow_disable_versioning',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Allow to disable versioning'),
            required=False))
    motion_workflow = ConfigVariable(
        name='motion_workflow',
        default_value=1,
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            label=ugettext_lazy('Workflow of new motions'),
            required=True,
            choices=[(workflow.pk, ugettext_lazy(workflow.name)) for workflow in Workflow.objects.all()]))
    motion_identifier = ConfigVariable(
        name='motion_identifier',
        default_value='per_category',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=True,
            label=ugettext_lazy('Identifier'),
            choices=[
                ('per_category', ugettext_lazy('Numbered per category')),
                ('serially_numbered', ugettext_lazy('Serially numbered')),
                ('manually', ugettext_lazy('Set it manually'))]))

    return ConfigPage(title=ugettext_noop('Motion'),
                      url='motion',
                      required_permission='config.can_manage',
                      weight=30,
                      variables=(motion_stop_submitting,
                                 motion_min_supporters,
                                 motion_remove_supporters,
                                 motion_preamble,
                                 motion_pdf_ballot_papers_selection,
                                 motion_pdf_ballot_papers_number,
                                 motion_pdf_title,
                                 motion_pdf_preamble,
                                 motion_pdf_paragraph_numbering,
                                 motion_allow_disable_versioning,
                                 motion_workflow,
                                 motion_identifier))
