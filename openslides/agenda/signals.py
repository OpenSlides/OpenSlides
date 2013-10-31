# -*- coding: utf-8 -*-

from datetime import datetime

from django import forms
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import config, ConfigPage, ConfigVariable
from openslides.config.signals import config_signal
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Overlay
from openslides.projector.signals import projector_overlays

from .models import Item


def validate_start_time(value):
    try:
        datetime.strptime(value, '%d.%m.%Y %H:%M')
    except ValueError:
        raise ValidationError(_('Invalid input.'))


# TODO: Reinsert the datepicker scripts in the template

@receiver(config_signal, dispatch_uid='setup_agenda_config_page')
def setup_agenda_config_page(sender, **kwargs):
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


@receiver(projector_overlays, dispatch_uid="agenda_list_of_speakers")
def agenda_list_of_speakers(sender, **kwargs):
    """
    Receiver for the list of speaker overlay.
    """
    name = 'agenda_speaker'

    def get_widget_html():
        """
        Returns the the html-code to show in the overly-widget.
        """
        return render_to_string('agenda/overlay_speaker_widget.html')

    def get_projector_html():
        """
        Returns an html-code to show on the projector.

        The overlay is only shown on agenda-items and not on the
        list-of-speakers slide.
        """
        active_slide = get_active_slide()
        slide_type = active_slide.get('type', None)
        active_slide_pk = active_slide.get('pk', None)
        if (active_slide['callback'] == 'agenda' and
                slide_type != 'list_of_speakers' and
                active_slide_pk is not None):
            item = Item.objects.get(pk=active_slide_pk)
            list_of_speakers = item.get_list_of_speakers(
                old_speakers_count=config['agenda_show_last_speakers'],
                coming_speakers_count=5)
            context = {
                'list_of_speakers': list_of_speakers,
                'closed': item.speaker_list_closed,
            }
            return render_to_string('agenda/overlay_speaker_projector.html', context)
        else:
            return None

    return Overlay(name, get_widget_html, get_projector_html)


@receiver(pre_delete)
def listen_to_related_object_delete_signal(sender, instance, **kwargs):
    """
    Receiver to listen whether a related item has been deleted.
    """
    if hasattr(instance, 'get_agenda_title'):
        for item in Item.objects.filter(content_type=ContentType.objects.get_for_model(sender), object_id=instance.pk):
            item.title = '< Item for deleted slide (%s) >' % instance.get_agenda_title()
            item.content_type = None
            item.object_id = None
            item.save()
