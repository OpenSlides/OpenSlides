# -*- coding: utf-8 -*-

from django import forms
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import ConfigPage, ConfigVariable


def get_participant_config_page(sender, **kwargs):
    """
    Participant config variables.
    """
    participant_pdf_welcometitle = ConfigVariable(
        name='participant_pdf_welcometitle',
        default_value=_('Welcome to OpenSlides!'),
        form_field=forms.CharField(
            widget=forms.Textarea(),
            required=False,
            label=ugettext_lazy('Title for access data and welcome PDF')))

    participant_pdf_welcometext = ConfigVariable(
        name='participant_pdf_welcometext',
        default_value=_('[Place for your welcome and help text.]'),
        form_field=forms.CharField(
            widget=forms.Textarea(),
            required=False,
            label=ugettext_lazy('Help text for access data and welcome PDF')))

    participant_sort_users_by_first_name = ConfigVariable(
        name='participant_sort_users_by_first_name',
        default_value=False,
        form_field=forms.BooleanField(
            required=False,
            label=ugettext_lazy('Sort participants by first name'),
            help_text=ugettext_lazy('Disable for sorting by last name')))

    return ConfigPage(title=ugettext_noop('Participant'),
                      url='participant',
                      required_permission='config.can_manage',
                      weight=50,
                      variables=(participant_pdf_welcometitle,
                                 participant_pdf_welcometext,
                                 participant_sort_users_by_first_name))
