from django.core.validators import MinValueValidator

from openslides.core.config import ConfigVariable
from openslides.poll.models import PERCENT_BASE_CHOICES

from .models import Workflow


def get_workflow_choices():
    """
    Returns a list of all workflows to be used as choices for the config variable
    'motions_workflow'. Each list item contains the pk and the display name.
    """
    return [{'value': str(workflow.pk), 'display_name': workflow.name}
            for workflow in Workflow.objects.all()]


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    They are grouped in 'General', 'Amendments', 'Supporters', 'Voting and ballot
    papers' and 'PDF'. The generator has to be evaluated during app loading
    (see apps.py).
    """
    PERCENT_BASE_CHOICES_MOTION = ({
        'value': "WITHOUT_ABSTAIN",
        'display_name': 'Yes and No votes'},)
    PERCENT_BASE_CHOICES_MOTION += PERCENT_BASE_CHOICES
    # General
    yield ConfigVariable(
        name='motions_workflow',
        default_value='1',
        input_type='choice',
        label='Workflow of new motions',
        choices=get_workflow_choices,
        weight=310,
        group='Motions',
        subgroup='General')

    yield ConfigVariable(
        name='motions_identifier',
        default_value='per_category',
        input_type='choice',
        label='Identifier',
        choices=(
            {'value': 'per_category', 'display_name': 'Numbered per category'},
            {'value': 'serially_numbered', 'display_name': 'Serially numbered'},
            {'value': 'manually', 'display_name': 'Set it manually'}),
        weight=315,
        group='Motions',
        subgroup='General')

    yield ConfigVariable(
        name='motions_preamble',
        default_value='The assembly may decide,',
        label='Motion preamble',
        weight=320,
        group='Motions',
        subgroup='General',
        translatable=True)

    yield ConfigVariable(
        name='motions_default_line_numbering',
        default_value='none',
        input_type='choice',
        label='Default line numbering',
        choices=(
            {'value': 'outside', 'display_name': 'Outside'},
            {'value': 'inline', 'display_name': 'Inline'},
            {'value': 'none', 'display_name': 'None'}),
        weight=322,
        group='Motions',
        subgroup='General')

    yield ConfigVariable(
        name='motions_line_length',
        default_value=80,
        input_type='integer',
        label='Line length',
        help_text='The maximum number of characters per line. Relevant when line numbering is enabled. Min: 40',
        weight=323,
        group='Motions',
        subgroup='General',
        validators=(MinValueValidator(40),))

    yield ConfigVariable(
        name='motions_stop_submitting',
        default_value=False,
        input_type='boolean',
        label='Stop submitting new motions by non-staff users',
        weight=325,
        group='Motions',
        subgroup='General')

    yield ConfigVariable(
        name='motions_allow_disable_versioning',
        default_value=False,
        input_type='boolean',
        label='Allow to disable versioning',
        weight=330,
        group='Motions',
        subgroup='General')

    # Amendments
    yield ConfigVariable(
        name='motions_amendments_enabled',
        default_value=False,
        input_type='boolean',
        label='Activate amendments',
        weight=335,
        group='Motions',
        subgroup='Amendments')

    yield ConfigVariable(
        name='motions_amendments_prefix',
        default_value='-',
        label='Prefix for the identifier for amendments',
        weight=340,
        group='Motions',
        subgroup='Amendments')

    yield ConfigVariable(
        name='motions_amendments_apply_title_text',
        default_value=False,
        input_type='boolean',
        label='Apply title and text for new amendments',
        weight=342,
        group='Motions',
        subgroup='Amendments')

    # Supporters

    yield ConfigVariable(
        name='motions_min_supporters',
        default_value=0,
        input_type='integer',
        label='Number of (minimum) required supporters for a motion',
        help_text='Choose 0 to disable the supporting system.',
        weight=345,
        group='Motions',
        subgroup='Supporters',
        validators=(MinValueValidator(0),))

    yield ConfigVariable(
        name='motions_remove_supporters',
        default_value=False,
        input_type='boolean',
        label='Remove all supporters of a motion if a submitter edits his motion in early state',
        weight=350,
        group='Motions',
        subgroup='Supporters')

    # Voting and ballot papers

    yield ConfigVariable(
        name='motions_poll_100_percent_base',
        default_value='WITHOUT_INVALID',
        input_type='choice',
        label='The 100 % base of a voting result consists of',
        choices=PERCENT_BASE_CHOICES_MOTION,
        weight=355,
        group='Motions',
        subgroup='Voting and ballot papers')

    yield ConfigVariable(
        name='motions_pdf_ballot_papers_selection',
        default_value='CUSTOM_NUMBER',
        input_type='choice',
        label='Number of ballot papers (selection)',
        choices=(
            {'value': 'NUMBER_OF_DELEGATES', 'display_name': 'Number of all delegates'},
            {'value': 'NUMBER_OF_ALL_PARTICIPANTS', 'display_name': 'Number of all participants'},
            {'value': 'CUSTOM_NUMBER', 'display_name': 'Use the following custom number'}),
        weight=360,
        group='Motions',
        subgroup='Voting and ballot papers')

    yield ConfigVariable(
        name='motions_pdf_ballot_papers_number',
        default_value=8,
        input_type='integer',
        label='Custom number of ballot papers',
        weight=365,
        group='Motions',
        subgroup='Voting and ballot papers',
        validators=(MinValueValidator(1),))

    # PDF

    yield ConfigVariable(
        name='motions_pdf_title',
        default_value='Motions',
        label='Title for PDF document (all motions)',
        weight=370,
        group='Motions',
        subgroup='PDF',
        translatable=True)

    yield ConfigVariable(
        name='motions_pdf_preamble',
        default_value='',
        label='Preamble text for PDF document (all motions)',
        weight=375,
        group='Motions',
        subgroup='PDF')

    yield ConfigVariable(
        name='motions_pdf_paragraph_numbering',
        default_value=False,
        input_type='boolean',
        label='Show paragraph numbering (only in PDF)',
        weight=380,
        group='Motions',
        subgroup='PDF')
