from datetime import datetime

from django import forms
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import ConfigCollection, ConfigVariable

from .models import Item


def validate_start_time(value):
    try:
        datetime.strptime(value, '%d.%m.%Y %H:%M')
    except ValueError:
        raise ValidationError(_('Invalid input.'))


# TODO: Reinsert the datepicker scripts in the template

def setup_agenda_config(sender, **kwargs):
    """
    Receiver function to setup all agenda config variables. It is connected to
    the signal openslides.config.signals.config_signal during app loading.
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

    agenda_number_prefix = ConfigVariable(
        name='agenda_number_prefix',
        default_value='',
        form_field=forms.CharField(
            label=ugettext_lazy('Numbering prefix for agenda items'),
            max_length=20,
            required=False))

    agenda_numeral_system = ConfigVariable(
        name='agenda_numeral_system',
        default_value='arabic',
        form_field=forms.ChoiceField(
            label=ugettext_lazy('Numeral system for agenda items'),
            widget=forms.Select(),
            choices=(
                ('arabic', ugettext_lazy('Arabic')),
                ('roman', ugettext_lazy('Roman'))),
            required=False))

    extra_stylefiles = ['css/jquery-ui-timepicker.css']
    extra_javascript = ['js/jquery/jquery-ui-timepicker-addon.min.js',
                        'js/jquery/jquery-ui-sliderAccess.min.js',
                        'js/jquery/datepicker-config.js']

    return ConfigCollection(title=ugettext_noop('Agenda'),
                            url='agenda',
                            weight=20,
                            variables=(agenda_start_event_date_time,
                                       agenda_show_last_speakers,
                                       agenda_couple_countdown_and_speakers,
                                       agenda_number_prefix,
                                       agenda_numeral_system),
                            extra_context={'extra_stylefiles': extra_stylefiles,
                                           'extra_javascript': extra_javascript})


def listen_to_related_object_delete_signal(sender, instance, **kwargs):
    """
    Receiver function to changed agenda items of a related items that is to
    be deleted. It is connected to the signal
    django.db.models.signals.pre_delete during app loading.
    """
    if hasattr(instance, 'get_agenda_title'):
        for item in Item.objects.filter(content_type=ContentType.objects.get_for_model(sender), object_id=instance.pk):
            item.title = '< Item for deleted slide (%s) >' % instance.get_agenda_title()
            item.content_type = None
            item.object_id = None
            item.save()
