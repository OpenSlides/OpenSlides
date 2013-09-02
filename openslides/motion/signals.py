#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the motion app.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import receiver
from django import forms
from django.utils.translation import ugettext as _, ugettext_lazy, ugettext_noop

from openslides.config.signals import config_signal
from openslides.config.api import ConfigVariable, ConfigPage
from openslides.core.signals import post_database_setup

from .models import Workflow, State


@receiver(config_signal, dispatch_uid='setup_motion_config_page')
def setup_motion_config_page(sender, **kwargs):
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
            label=ugettext_lazy('Show paragraph numbering'),
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


@receiver(post_database_setup, dispatch_uid='motion_create_builtin_workflows')
def create_builtin_workflows(sender, **kwargs):
    """
    Creates a simple and a complex workflow.
    """
    workflow_1, created = Workflow.objects.get_or_create(name=ugettext_noop('Simple Workflow'))
    if created:
        state_1_1 = State.objects.create(name=ugettext_noop('submitted'),
                                         workflow=workflow_1,
                                         allow_create_poll=True,
                                         allow_support=True,
                                         allow_submitter_edit=True)
        state_1_2 = State.objects.create(name=ugettext_noop('accepted'),
                                         workflow=workflow_1,
                                         action_word=ugettext_noop('Accept'))
        state_1_3 = State.objects.create(name=ugettext_noop('rejected'),
                                         workflow=workflow_1,
                                         action_word=ugettext_noop('Reject'))
        state_1_4 = State.objects.create(name=ugettext_noop('not decided'),
                                         workflow=workflow_1,
                                         action_word=ugettext_noop('Do not decide'))
        state_1_1.next_states.add(state_1_2, state_1_3, state_1_4)
        workflow_1.first_state = state_1_1
        workflow_1.save()

    workflow_2, created = Workflow.objects.get_or_create(name=ugettext_noop('Complex Workflow'))
    if created:
        state_2_1 = State.objects.create(name=ugettext_noop('published'),
                                         workflow=workflow_2,
                                         allow_support=True,
                                         allow_submitter_edit=True,
                                         dont_set_identifier=True)
        state_2_2 = State.objects.create(name=ugettext_noop('permitted'),
                                         workflow=workflow_2,
                                         action_word=ugettext_noop('Permit'),
                                         allow_create_poll=True,
                                         allow_submitter_edit=True,
                                         versioning=True,
                                         leave_old_version_active=True)
        state_2_3 = State.objects.create(name=ugettext_noop('accepted'),
                                         workflow=workflow_2,
                                         action_word=ugettext_noop('Accept'),
                                         versioning=True)
        state_2_4 = State.objects.create(name=ugettext_noop('rejected'),
                                         workflow=workflow_2,
                                         action_word=ugettext_noop('Reject'),
                                         versioning=True)
        state_2_5 = State.objects.create(name=ugettext_noop('withdrawed'),
                                         workflow=workflow_2,
                                         action_word=ugettext_noop('Withdraw'),
                                         versioning=True)
        state_2_6 = State.objects.create(name=ugettext_noop('adjourned'),
                                         workflow=workflow_2,
                                         action_word=ugettext_noop('Adjourn'),
                                         versioning=True)
        state_2_7 = State.objects.create(name=ugettext_noop('not concerned'),
                                         workflow=workflow_2,
                                         action_word=ugettext_noop('Do not concern'),
                                         versioning=True)
        state_2_8 = State.objects.create(name=ugettext_noop('commited a bill'),
                                         workflow=workflow_2,
                                         action_word=ugettext_noop('Commit a bill'),
                                         versioning=True)
        state_2_9 = State.objects.create(name=ugettext_noop('needs review'),
                                         workflow=workflow_2,
                                         action_word=ugettext_noop('Needs review'),
                                         versioning=True)
        state_2_10 = State.objects.create(name=ugettext_noop('rejected (not authorized)'),
                                          workflow=workflow_2,
                                          action_word=ugettext_noop('Reject (not authorized)'),
                                          versioning=True)
        state_2_1.next_states.add(state_2_2, state_2_5, state_2_10)
        state_2_2.next_states.add(state_2_3, state_2_4, state_2_5, state_2_6, state_2_7, state_2_8, state_2_9)
        workflow_2.first_state = state_2_1
        workflow_2.save()
