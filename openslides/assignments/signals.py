from django.core.validators import MinValueValidator
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from openslides.core.config import ConfigVariable
from openslides.poll.models import PERCENT_BASE_CHOICES


def setup_assignment_config(sender, **kwargs):
    """
    Receiver function to setup all assignment config variables. They are
    grouped in 'Ballot and ballot papers' and 'PDF'. This function is
    connected to the signal openslides.core.signals.config_signal during
    app loading.
    """
    # Ballot and ballot papers

    yield ConfigVariable(
        name='assignments_poll_vote_values',
        default_value='auto',
        input_type='choice',
        label=ugettext_lazy('Election method'),
        choices=(
            {'value': 'auto', 'display_name': ugettext_lazy('Automatic assign of method')},
            {'value': 'votes', 'display_name': ugettext_lazy('Always one option per candidate')},
            {'value': 'yesnoabstain', 'display_name': ugettext_lazy('Always Yes-No-Abstain per candidate')}),
        weight=410,
        group=ugettext_lazy('Elections'),
        subgroup=ugettext_lazy('Ballot and ballot papers'))

    yield ConfigVariable(
        name='assignments_poll_100_percent_base',
        default_value='WITHOUT_INVALID',
        input_type='choice',
        label=ugettext_lazy('The 100 % base of an election result consists of'),
        choices=PERCENT_BASE_CHOICES,
        weight=420,
        group=ugettext_lazy('Elections'),
        subgroup=ugettext_lazy('Ballot and ballot papers'))

    yield ConfigVariable(
        name='assignments_pdf_ballot_papers_selection',
        default_value='CUSTOM_NUMBER',
        input_type='choice',
        label=ugettext_lazy('Number of ballot papers (selection)'),
        choices=(
            {'value': 'NUMBER_OF_DELEGATES', 'display_name': ugettext_lazy('Number of all delegates')},
            {'value': 'NUMBER_OF_ALL_PARTICIPANTS', 'display_name': ugettext_lazy('Number of all participants')},
            {'value': 'CUSTOM_NUMBER', 'display_name': ugettext_lazy('Use the following custom number')}),
        weight=430,
        group=ugettext_lazy('Elections'),
        subgroup=ugettext_lazy('Ballot and ballot papers'))

    yield ConfigVariable(
        name='assignments_pdf_ballot_papers_number',
        default_value=8,
        input_type='integer',
        label=ugettext_lazy('Custom number of ballot papers'),
        weight=440,
        group=ugettext_lazy('Elections'),
        subgroup=ugettext_lazy('Ballot and ballot papers'),
        validators=(MinValueValidator(1),))

    yield ConfigVariable(
        name='assignments_publish_winner_results_only',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Publish election result for elected candidates only '
                            '(projector view)'),
        weight=450,
        group=ugettext_lazy('Elections'),
        subgroup=ugettext_lazy('Ballot and ballot papers'))

    # PDF

    yield ConfigVariable(
        name='assignments_pdf_title',
        default_value=_('Elections'),
        label=ugettext_lazy('Title for PDF document (all elections)'),
        weight=460,
        group=ugettext_lazy('Elections'),
        subgroup=ugettext_lazy('PDF'),
        translatable=True)

    yield ConfigVariable(
        name='assignments_pdf_preamble',
        default_value='',
        label=ugettext_lazy('Preamble text for PDF document (all elections)'),
        weight=470,
        group=ugettext_lazy('Elections'),
        subgroup=ugettext_lazy('PDF'))
