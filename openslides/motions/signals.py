from django import forms
from django.utils.translation import ugettext as _
from django.utils.translation import pgettext, ugettext_lazy, ugettext_noop

from openslides.config.api import (
    ConfigGroup,
    ConfigGroupedCollection,
    ConfigVariable,
)
from openslides.poll.models import PERCENT_BASE_CHOICES

from .models import State, Workflow


def setup_motion_config(sender, **kwargs):
    """
    Receiver function to setup all motion config variables. It is connected to
    the signal openslides.config.signals.config_signal during app loading.
    """
    # General
    motions_workflow = ConfigVariable(
        name='motions_workflow',
        default_value='1',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            label=ugettext_lazy('Workflow of new motions'),
            required=True,
            choices=[(str(workflow.pk), ugettext_lazy(workflow.name)) for workflow in Workflow.objects.all()]))
    motions_identifier = ConfigVariable(
        name='motions_identifier',
        default_value='per_category',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=True,
            label=ugettext_lazy('Identifier'),
            choices=[
                ('per_category', ugettext_lazy('Numbered per category')),
                ('serially_numbered', ugettext_lazy('Serially numbered')),
                ('manually', ugettext_lazy('Set it manually'))]))
    motions_preamble = ConfigVariable(
        name='motions_preamble',
        default_value=_('The assembly may decide,'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=ugettext_lazy('Motion preamble')))
    motions_stop_submitting = ConfigVariable(
        name='motions_stop_submitting',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Stop submitting new motions by non-staff users'),
            required=False))
    motions_allow_disable_versioning = ConfigVariable(
        name='motions_allow_disable_versioning',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Allow to disable versioning'),
            required=False))
    group_general = ConfigGroup(
        title=ugettext_lazy('General'),
        variables=(
            motions_workflow,
            motions_identifier,
            motions_preamble,
            motions_stop_submitting,
            motions_allow_disable_versioning))

    # Amendments
    motions_amendments_enabled = ConfigVariable(
        name='motions_amendments_enabled',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Activate amendments'),
            required=False))

    motions_amendments_prefix = ConfigVariable(
        name='motions_amendments_prefix',
        default_value=pgettext('Prefix for the identifier for amendments', 'A'),
        form_field=forms.CharField(
            required=False,
            label=ugettext_lazy('Prefix for the identifier for amendments')))

    group_amendments = ConfigGroup(
        title=ugettext_lazy('Amendments'),
        variables=(motions_amendments_enabled, motions_amendments_prefix))

    # Supporters
    motions_min_supporters = ConfigVariable(
        name='motions_min_supporters',
        default_value=0,
        form_field=forms.IntegerField(
            widget=forms.TextInput(attrs={'class': 'small-input'}),
            label=ugettext_lazy('Number of (minimum) required supporters for a motion'),
            min_value=0,
            help_text=ugettext_lazy('Choose 0 to disable the supporting system.')))
    motions_remove_supporters = ConfigVariable(
        name='motions_remove_supporters',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Remove all supporters of a motion if a submitter edits his motion in early state'),
            required=False))
    group_supporters = ConfigGroup(
        title=ugettext_lazy('Supporters'),
        variables=(motions_min_supporters, motions_remove_supporters))

    # Voting and ballot papers
    motions_poll_100_percent_base = ConfigVariable(
        name='motions_poll_100_percent_base',
        default_value='WITHOUT_INVALID',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=False,
            label=ugettext_lazy('The 100 % base of a voting result consists of'),
            choices=PERCENT_BASE_CHOICES))
    motions_pdf_ballot_papers_selection = ConfigVariable(
        name='motions_pdf_ballot_papers_selection',
        default_value='CUSTOM_NUMBER',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=False,
            label=ugettext_lazy('Number of ballot papers (selection)'),
            choices=[
                ('NUMBER_OF_DELEGATES', ugettext_lazy('Number of all delegates')),
                ('NUMBER_OF_ALL_PARTICIPANTS', ugettext_lazy('Number of all participants')),
                ('CUSTOM_NUMBER', ugettext_lazy("Use the following custom number"))]))
    motions_pdf_ballot_papers_number = ConfigVariable(
        name='motions_pdf_ballot_papers_number',
        default_value=8,
        form_field=forms.IntegerField(
            widget=forms.TextInput(attrs={'class': 'small-input'}),
            required=False,
            min_value=1,
            label=ugettext_lazy('Custom number of ballot papers')))
    group_ballot_papers = ConfigGroup(
        title=ugettext_lazy('Voting and ballot papers'),
        variables=(
            motions_poll_100_percent_base,
            motions_pdf_ballot_papers_selection,
            motions_pdf_ballot_papers_number))

    # PDF
    motions_pdf_title = ConfigVariable(
        name='motions_pdf_title',
        default_value=_('Motions'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=ugettext_lazy('Title for PDF document (all motions)')))
    motions_pdf_preamble = ConfigVariable(
        name='motions_pdf_preamble',
        default_value='',
        form_field=forms.CharField(
            widget=forms.Textarea(),
            required=False,
            label=ugettext_lazy('Preamble text for PDF document (all motions)')))
    motions_pdf_paragraph_numbering = ConfigVariable(
        name='motions_pdf_paragraph_numbering',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Show paragraph numbering (only in PDF)'),
            required=False))
    group_pdf = ConfigGroup(
        title=ugettext_lazy('PDF'),
        variables=(
            motions_pdf_title,
            motions_pdf_preamble,
            motions_pdf_paragraph_numbering))

    return ConfigGroupedCollection(
        title=ugettext_noop('Motion'),
        url='motion',
        weight=30,
        groups=(group_general, group_amendments, group_supporters,
                group_ballot_papers, group_pdf))


def create_builtin_workflows(sender, **kwargs):
    """
    Receiver function to create a simple and a complex workflow. It is
    connected to the signal openslides.core.signals.post_database_setup
    during app loading.
    """
    if Workflow.objects.exists():
        # If there is at least one workflow, then do nothing.
        return

    workflow_1 = Workflow.objects.create(name=ugettext_noop('Simple Workflow'))
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

    workflow_2 = Workflow.objects.create(name=ugettext_noop('Complex Workflow'))
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
