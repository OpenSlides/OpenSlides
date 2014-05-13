# -*- coding: utf-8 -*-

from django import forms
from django.dispatch import receiver
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import ConfigGroup, ConfigGroupedCollection, ConfigVariable
from openslides.config.signals import config_signal
from openslides.poll.models import PERCENT_BASE_CHOICES


@receiver(config_signal, dispatch_uid='setup_assignment_config')
def setup_assignment_config(sender, **kwargs):
    """
    Assignment config variables.
    """
    # Ballot and ballot papers
    assignment_poll_vote_values = ConfigVariable(
        name='assignment_poll_vote_values',
        default_value='auto',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=False,
            label=ugettext_lazy('Election method'),
            choices=(
                ('auto', ugettext_lazy('Automatic assign of method')),
                ('votes', ugettext_lazy('Always one option per candidate')),
                ('yesnoabstain', ugettext_lazy('Always Yes-No-Abstain per candidate')))))
    assignment_poll_100_percent_base = ConfigVariable(
        name='assignment_poll_100_percent_base',
        default_value='WITHOUT_INVALID',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=False,
            label=ugettext_lazy('The 100 % base of an election result consists of'),
            choices=PERCENT_BASE_CHOICES))
    assignment_pdf_ballot_papers_selection = ConfigVariable(
        name='assignment_pdf_ballot_papers_selection',
        default_value='CUSTOM_NUMBER',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=False,
            label=ugettext_lazy('Number of ballot papers (selection)'),
            choices=(
                ('NUMBER_OF_DELEGATES', ugettext_lazy('Number of all delegates')),
                ('NUMBER_OF_ALL_PARTICIPANTS', ugettext_lazy('Number of all participants')),
                ('CUSTOM_NUMBER', ugettext_lazy('Use the following custom number')))))
    assignment_pdf_ballot_papers_number = ConfigVariable(
        name='assignment_pdf_ballot_papers_number',
        default_value=8,
        form_field=forms.IntegerField(
            widget=forms.TextInput(attrs={'class': 'small-input'}),
            required=False,
            min_value=1,
            label=ugettext_lazy('Custom number of ballot papers')))
    assignment_publish_winner_results_only = ConfigVariable(
        name='assignment_publish_winner_results_only',
        default_value=False,
        form_field=forms.BooleanField(
            required=False,
            label=ugettext_lazy('Publish election result for elected candidates only '
                                '(projector view)')))
    group_ballot = ConfigGroup(
        title=ugettext_lazy('Ballot and ballot papers'),
        variables=(assignment_poll_vote_values,
                   assignment_poll_100_percent_base,
                   assignment_pdf_ballot_papers_selection,
                   assignment_pdf_ballot_papers_number,
                   assignment_publish_winner_results_only))

    # PDF
    assignment_pdf_title = ConfigVariable(
        name='assignment_pdf_title',
        default_value=_('Elections'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=ugettext_lazy('Title for PDF document (all elections)')))
    assignment_pdf_preamble = ConfigVariable(
        name='assignment_pdf_preamble',
        default_value='',
        form_field=forms.CharField(
            widget=forms.Textarea(),
            required=False,
            label=ugettext_lazy('Preamble text for PDF document (all elections)')))
    group_pdf = ConfigGroup(
        title=ugettext_lazy('PDF'),
        variables=(assignment_pdf_title, assignment_pdf_preamble))

    return ConfigGroupedCollection(
        title=ugettext_noop('Elections'),
        url='assignment',
        weight=40,
        groups=(group_ballot, group_pdf))
