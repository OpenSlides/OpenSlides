# -*- coding: utf-8 -*-

from datetime import datetime

from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import ConfigPage, ConfigVariable


def validate_start_time(value):
    try:
        datetime.strptime(value, '%d.%m.%Y %H:%M')
    except ValueError:
        raise ValidationError(_('Invalid input.'))


# TODO: Reinsert the datepicker scripts in the template
def get_agenda_config_page(sender, **kwargs):
    """
    Agenda config variables.
    """
    # TODO: Insert validator for the format or use other field carefully.
    agenda_start_event_date_time = ConfigVariable(
        name='agenda_start_event_date_time',
        default_value='',
        form_field=forms.CharField(
            validators=[validate_start_time, ],
            widget=forms.DateTimeInput(format='%d.%m.%Y %H:%M'),
            required=False,
            label=ugettext_lazy('Begin of event'),
            help_text=ugettext_lazy('Input format: DD.MM.YYYY HH:MM')))

    agenda_show_last_speakers = ConfigVariable(
        name='agenda_show_last_speakers',
        default_value=1,
        form_field=forms.IntegerField(
            min_value=0,
            label=ugettext_lazy('Number of last speakers to be shown on the projector')))

    agenda_couple_countdown_and_speakers = ConfigVariable(
        name='agenda_couple_countdown_and_speakers',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Couple countdown with the list of speakers'),
            help_text=ugettext_lazy('[Begin speach] starts the countdown, [End speach] stops the countdown.'),
            required=False))

    extra_stylefiles = ['styles/timepicker.css', 'styles/jquery-ui/jquery-ui.custom.min.css']
    extra_javascript = ['javascript/jquery-ui.custom.min.js',
                        'javascript/jquery-ui-timepicker-addon.min.js',
                        'javascript/jquery-ui-sliderAccess.min.js',
                        'javascript/agenda-config-datepicker.js']

    return ConfigPage(title=ugettext_noop('Agenda'),
                      url='agenda',
                      required_permission='config.can_manage',
                      weight=20,
                      variables=(agenda_start_event_date_time,
                                 agenda_show_last_speakers,
                                 agenda_couple_countdown_and_speakers),
                      extra_context={'extra_stylefiles': extra_stylefiles,
                                     'extra_javascript': extra_javascript})
