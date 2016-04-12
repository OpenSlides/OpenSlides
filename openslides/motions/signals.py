from django.core.validators import MinValueValidator
from django.utils.translation import ugettext as _
from django.utils.translation import pgettext, ugettext_lazy, ugettext_noop

from openslides.core.config import ConfigVariable
from openslides.poll.models import PERCENT_BASE_CHOICES

from .models import State, Workflow


def setup_motion_config(sender, **kwargs):
    """
    Receiver function to setup all motion config variables. They are
    grouped in 'General', 'Amendments', 'Supporters', 'Voting and ballot
    papers' and 'PDF'. This function connected to the signal
    openslides.core.signals.config_signal during app loading.
    """
    # General

    yield ConfigVariable(
        name='motions_workflow',
        default_value='1',
        input_type='choice',
        label=ugettext_lazy('Workflow of new motions'),
        choices=({'value': str(workflow.pk), 'display_name': ugettext_lazy(workflow.name)} for workflow in Workflow.objects.all()),
        weight=310,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('General'))

    yield ConfigVariable(
        name='motions_identifier',
        default_value='per_category',
        input_type='choice',
        label=ugettext_lazy('Identifier'),
        choices=(
            {'value': 'per_category', 'display_name': ugettext_lazy('Numbered per category')},
            {'value': 'serially_numbered', 'display_name': ugettext_lazy('Serially numbered')},
            {'value': 'manually', 'display_name': ugettext_lazy('Set it manually')}),
        weight=315,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('General'))

    yield ConfigVariable(
        name='motions_preamble',
        default_value=_('The assembly may decide,'),
        label=ugettext_lazy('Motion preamble'),
        weight=320,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('General'),
        translatable=True)

    yield ConfigVariable(
        name='motions_stop_submitting',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Stop submitting new motions by non-staff users'),
        weight=325,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('General'))

    yield ConfigVariable(
        name='motions_allow_disable_versioning',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Allow to disable versioning'),
        weight=330,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('General'))

    # Amendments
    # Amendments currently not implemented. (TODO: Implement it like in OpenSlides 1.7.)
    yield ConfigVariable(
        name='motions_amendments_enabled',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Activate amendments'),
        hidden=True,
        weight=335,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('Amendments'))

    yield ConfigVariable(
        name='motions_amendments_prefix',
        default_value=pgettext('Prefix for the identifier for amendments', 'A'),
        label=ugettext_lazy('Prefix for the identifier for amendments'),
        hidden=True,
        weight=340,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('Amendments'))

    # Supporters

    yield ConfigVariable(
        name='motions_min_supporters',
        default_value=0,
        input_type='integer',
        label=ugettext_lazy('Number of (minimum) required supporters for a motion'),
        help_text=ugettext_lazy('Choose 0 to disable the supporting system.'),
        weight=345,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('Supporters'),
        validators=(MinValueValidator(0),))

    yield ConfigVariable(
        name='motions_remove_supporters',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Remove all supporters of a motion if a submitter edits his motion in early state'),
        weight=350,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('Supporters'))

    # Voting and ballot papers

    yield ConfigVariable(
        name='motions_poll_100_percent_base',
        default_value='WITHOUT_INVALID',
        input_type='choice',
        label=ugettext_lazy('The 100 % base of a voting result consists of'),
        choices=PERCENT_BASE_CHOICES,
        weight=355,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('Voting and ballot papers'))

    yield ConfigVariable(
        name='motions_pdf_ballot_papers_selection',
        default_value='CUSTOM_NUMBER',
        input_type='choice',
        label=ugettext_lazy('Number of ballot papers (selection)'),
        choices=(
            {'value': 'NUMBER_OF_DELEGATES', 'display_name': ugettext_lazy('Number of all delegates')},
            {'value': 'NUMBER_OF_ALL_PARTICIPANTS', 'display_name': ugettext_lazy('Number of all participants')},
            {'value': 'CUSTOM_NUMBER', 'display_name': ugettext_lazy('Use the following custom number')}),
        weight=360,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('Voting and ballot papers'))

    yield ConfigVariable(
        name='motions_pdf_ballot_papers_number',
        default_value=8,
        input_type='integer',
        label=ugettext_lazy('Custom number of ballot papers'),
        weight=365,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('Voting and ballot papers'),
        validators=(MinValueValidator(1),))

    # PDF

    yield ConfigVariable(
        name='motions_pdf_title',
        default_value=_('Motions'),
        label=ugettext_lazy('Title for PDF document (all motions)'),
        weight=370,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('PDF'),
        translatable=True)

    yield ConfigVariable(
        name='motions_pdf_preamble',
        default_value='',
        label=ugettext_lazy('Preamble text for PDF document (all motions)'),
        weight=375,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('PDF'))

    yield ConfigVariable(
        name='motions_pdf_paragraph_numbering',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Show paragraph numbering (only in PDF)'),
        weight=380,
        group=ugettext_lazy('Motions'),
        subgroup=ugettext_lazy('PDF'))


def create_builtin_workflows(sender, **kwargs):
    """
    Receiver function to create a simple and a complex workflow. It is
    connected to the signal openslides.core.signals.post_database_setup
    during app loading.
    """
    if Workflow.objects.exists():
        # If there is at least one workflow, then do nothing.
        return

    workflow_1 = Workflow.objects.create(name='Simple Workflow')
    state_1_1 = State.objects.create(name=ugettext_noop('submitted'),
                                     workflow=workflow_1,
                                     allow_create_poll=True,
                                     allow_support=True,
                                     allow_submitter_edit=True)
    state_1_2 = State.objects.create(name=ugettext_noop('accepted'),
                                     workflow=workflow_1,
                                     action_word='Accept',
                                     css_class='success')
    state_1_3 = State.objects.create(name=ugettext_noop('rejected'),
                                     workflow=workflow_1,
                                     action_word='Reject',
                                     css_class='danger')
    state_1_4 = State.objects.create(name=ugettext_noop('not decided'),
                                     workflow=workflow_1,
                                     action_word='Do not decide',
                                     css_class='default')
    state_1_1.next_states.add(state_1_2, state_1_3, state_1_4)
    workflow_1.first_state = state_1_1
    workflow_1.save()

    workflow_2 = Workflow.objects.create(name='Complex Workflow')
    state_2_1 = State.objects.create(name=ugettext_noop('published'),
                                     workflow=workflow_2,
                                     allow_support=True,
                                     allow_submitter_edit=True,
                                     dont_set_identifier=True)
    state_2_2 = State.objects.create(name=ugettext_noop('permitted'),
                                     workflow=workflow_2,
                                     action_word='Permit',
                                     allow_create_poll=True,
                                     allow_submitter_edit=True,
                                     versioning=True,
                                     leave_old_version_active=True)
    state_2_3 = State.objects.create(name=ugettext_noop('accepted'),
                                     workflow=workflow_2,
                                     action_word='Accept',
                                     versioning=True,
                                     css_class='success')
    state_2_4 = State.objects.create(name=ugettext_noop('rejected'),
                                     workflow=workflow_2,
                                     action_word='Reject',
                                     versioning=True,
                                     css_class='danger')
    state_2_5 = State.objects.create(name=ugettext_noop('withdrawed'),
                                     workflow=workflow_2,
                                     action_word='Withdraw',
                                     versioning=True,
                                     css_class='default')
    state_2_6 = State.objects.create(name=ugettext_noop('adjourned'),
                                     workflow=workflow_2,
                                     action_word='Adjourn',
                                     versioning=True,
                                     css_class='default')
    state_2_7 = State.objects.create(name=ugettext_noop('not concerned'),
                                     workflow=workflow_2,
                                     action_word='Do not concern',
                                     versioning=True,
                                     css_class='default')
    state_2_8 = State.objects.create(name=ugettext_noop('commited a bill'),
                                     workflow=workflow_2,
                                     action_word='Commit a bill',
                                     versioning=True,
                                     css_class='default')
    state_2_9 = State.objects.create(name=ugettext_noop('needs review'),
                                     workflow=workflow_2,
                                     action_word='Needs review',
                                     versioning=True,
                                     css_class='default')
    state_2_10 = State.objects.create(name=ugettext_noop('rejected (not authorized)'),
                                      workflow=workflow_2,
                                      action_word='Reject (not authorized)',
                                      versioning=True,
                                      css_class='default')
    state_2_1.next_states.add(state_2_2, state_2_5, state_2_10)
    state_2_2.next_states.add(state_2_3, state_2_4, state_2_5, state_2_6, state_2_7, state_2_8, state_2_9)
    workflow_2.first_state = state_2_1
    workflow_2.save()
