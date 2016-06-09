from django.core.validators import MinValueValidator
from django.utils.translation import pgettext_lazy, ugettext_lazy

from openslides.core.config import ConfigVariable
from openslides.poll.models import PERCENT_BASE_CHOICES

from .models import Workflow


def get_workflow_choices():
    """
    Returns a list of all workflows to be used as choices for the config variable
    'motions_workflow'. Each list item contains the pk and the display name.
    """
    return [{'value': str(workflow.pk), 'display_name': ugettext_lazy(workflow.name)}
            for workflow in Workflow.objects.all()]


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    They are grouped in 'General', 'Amendments', 'Supporters', 'Voting and ballot
    papers' and 'PDF'. The generator has to be evaluated during app loading
    (see apps.py).
    """
    # General
    yield ConfigVariable(
        name='motions_workflow',
        default_value='1',
        input_type='choice',
        label=ugettext_lazy('Workflow of new motions'),
        choices=get_workflow_choices,
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
        default_value=ugettext_lazy('The assembly may decide,'),
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
        default_value=pgettext_lazy('Prefix for the identifier for amendments', 'A'),
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
        default_value=ugettext_lazy('Motions'),
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
