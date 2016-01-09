from datetime import datetime

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import MaxLengthValidator, MinValueValidator
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from openslides.core.config import ConfigVariable

from .models import Item


def validate_start_time(value):
    try:
        datetime.strptime(value, '%d.%m.%Y %H:%M')
    except ValueError:
        raise DjangoValidationError(_('Invalid input.'))


def setup_agenda_config(sender, **kwargs):
    """
    Receiver function to setup all agenda config variables. They are not
    grouped. This function connected to the signal
    openslides.core.signals.config_signal during app loading.
    """
    # TODO: Use an input type with generic datetime support.
    yield ConfigVariable(
        name='agenda_start_event_date_time',
        default_value='',
        label=ugettext_lazy('Begin of event'),
        help_text=ugettext_lazy('Input format: DD.MM.YYYY HH:MM'),
        weight=210,
        group=ugettext_lazy('Agenda'),
        validators=(validate_start_time,))

    yield ConfigVariable(
        name='agenda_show_last_speakers',
        default_value=1,
        input_type='integer',
        label=ugettext_lazy('Number of last speakers to be shown on the projector'),
        weight=220,
        group=ugettext_lazy('Agenda'),
        validators=(MinValueValidator(0),))

    yield ConfigVariable(
        name='agenda_couple_countdown_and_speakers',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Couple countdown with the list of speakers'),
        help_text=ugettext_lazy('[Begin speech] starts the countdown, [End speech] stops the countdown.'),
        weight=230,
        group=ugettext_lazy('Agenda'))

    yield ConfigVariable(
        name='agenda_number_prefix',
        default_value='',
        label=ugettext_lazy('Numbering prefix for agenda items'),
        help_text=ugettext_lazy('This prefix will be set if you run the automatic agenda numbering.'),
        weight=240,
        group=ugettext_lazy('Agenda'),
        validators=(MaxLengthValidator(20),))

    yield ConfigVariable(
        name='agenda_numeral_system',
        default_value='arabic',
        input_type='choice',
        label=ugettext_lazy('Numeral system for agenda items'),
        choices=(
            {'value': 'arabic', 'display_name': ugettext_lazy('Arabic')},
            {'value': 'roman', 'display_name': ugettext_lazy('Roman')}),
        weight=250,
        group=ugettext_lazy('Agenda'))


def listen_to_related_object_post_save(sender, instance, created, **kwargs):
    """
    Receiver function to create agenda items. It is connected to the signal
    django.db.models.signals.post_save during app loading.
    """
    if created and hasattr(instance, 'get_agenda_title'):
        Item.objects.create(content_object=instance)


def listen_to_related_object_post_delete(sender, instance, **kwargs):
    """
    Receiver function to delete agenda items. It is connected to the signal
    django.db.models.signals.post_delete during app loading.
    """
    if hasattr(instance, 'get_agenda_title'):
        content_type = ContentType.objects.get_for_model(instance)
        try:
            Item.objects.get(object_id=instance.pk, content_type=content_type).delete()
        except Item.DoesNotExist:
            # Item does not exist so we do not have to delete it.
            pass
