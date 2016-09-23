from django.core.validators import MaxLengthValidator, MinValueValidator

from openslides.core.config import ConfigVariable


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    It has to be evaluated during app loading (see apps.py).
    """
    yield ConfigVariable(
        name='agenda_number_prefix',
        default_value='',
        label='Numbering prefix for agenda items',
        help_text='This prefix will be set if you run the automatic agenda numbering.',
        weight=210,
        group='Agenda',
        subgroup='General',
        validators=(MaxLengthValidator(20),))

    yield ConfigVariable(
        name='agenda_numeral_system',
        default_value='arabic',
        input_type='choice',
        label='Numeral system for agenda items',
        choices=(
            {'value': 'arabic', 'display_name': 'Arabic'},
            {'value': 'roman', 'display_name': 'Roman'}),
        weight=215,
        group='Agenda',
        subgroup='General')

    yield ConfigVariable(
        name='agenda_start_event_date_time',
        default_value=None,
        input_type='datetimepicker',
        label='Begin of event',
        help_text='Input format: DD.MM.YYYY HH:MM',
        weight=220,
        group='Agenda',
        subgroup='General')

    # List of speakers

    yield ConfigVariable(
        name='agenda_show_last_speakers',
        default_value=1,
        input_type='integer',
        label='Number of last speakers to be shown on the projector',
        weight=230,
        group='Agenda',
        subgroup='List of speakers',
        validators=(MinValueValidator(0),))

    yield ConfigVariable(
        name='agenda_countdown_warning_time',
        default_value=0,
        input_type='integer',
        label='Show orange countdown in the last x seconds of speaking time',
        help_text='Enter duration in seconds. Choose 0 to disable warning color.',
        weight=235,
        group='Agenda',
        subgroup='List of speakers',
        validators=(MinValueValidator(0),))

    yield ConfigVariable(
        name='agenda_couple_countdown_and_speakers',
        default_value=False,
        input_type='boolean',
        label='Couple countdown with the list of speakers',
        help_text='[Begin speech] starts the countdown, [End speech] stops the countdown.',
        weight=240,
        group='Agenda',
        subgroup='List of speakers')
