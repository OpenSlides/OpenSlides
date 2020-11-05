from django.core.validators import MaxLengthValidator, MinValueValidator

from openslides.core.config import ConfigVariable


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    It has to be evaluated during app loading (see apps.py).
    """

    # General

    yield ConfigVariable(
        name="agenda_start_event_date_time",
        default_value=None,
        input_type="datetimepicker",
        label="Begin of event",
        help_text="Input format: DD.MM.YYYY HH:MM",
        weight=200,
        group="Agenda",
    )

    yield ConfigVariable(
        name="agenda_show_subtitle",
        default_value=False,
        input_type="boolean",
        label="Show subtitles in the agenda",
        weight=201,
        group="Agenda",
    )

    # Numbering

    yield ConfigVariable(
        name="agenda_enable_numbering",
        label="Enable numbering for agenda items",
        input_type="boolean",
        default_value=True,
        weight=205,
        group="Agenda",
        subgroup="Numbering",
    )

    yield ConfigVariable(
        name="agenda_number_prefix",
        default_value="",
        label="Numbering prefix for agenda items",
        help_text="This prefix will be set if you run the automatic agenda numbering.",
        weight=206,
        group="Agenda",
        subgroup="Numbering",
        validators=(MaxLengthValidator(20),),
    )

    yield ConfigVariable(
        name="agenda_numeral_system",
        default_value="arabic",
        input_type="choice",
        label="Numeral system for agenda items",
        choices=(
            {"value": "arabic", "display_name": "Arabic"},
            {"value": "roman", "display_name": "Roman"},
        ),
        weight=207,
        group="Agenda",
        subgroup="Numbering",
    )

    # Visibility

    yield ConfigVariable(
        name="agenda_item_creation",
        label="Add to agenda",
        default_value="default_yes",
        input_type="choice",
        choices=(
            {"value": "always", "display_name": "Always"},
            {"value": "never", "display_name": "Never"},
            {"value": "default_yes", "display_name": "Ask, default yes"},
            {"value": "default_no", "display_name": "Ask, default no"},
        ),
        weight=210,
        group="Agenda",
        subgroup="Visibility",
    )

    yield ConfigVariable(
        name="agenda_new_items_default_visibility",
        default_value="2",
        input_type="choice",
        choices=(
            {"value": "1", "display_name": "Public item"},
            {"value": "2", "display_name": "Internal item"},
            {"value": "3", "display_name": "Hidden item"},
        ),
        label="Default visibility for new agenda items (except topics)",
        weight=211,
        group="Agenda",
        subgroup="Visibility",
    )

    yield ConfigVariable(
        name="agenda_hide_internal_items_on_projector",
        default_value=True,
        input_type="boolean",
        label="Hide internal items when projecting subitems",
        weight=212,
        group="Agenda",
        subgroup="Visibility",
    )

    # List of speakers

    yield ConfigVariable(
        name="agenda_show_last_speakers",
        default_value=0,
        input_type="integer",
        label="Number of last speakers to be shown on the projector",
        weight=220,
        group="Agenda",
        subgroup="List of speakers",
        validators=(MinValueValidator(0),),
    )

    yield ConfigVariable(
        name="agenda_show_next_speakers",
        default_value=-1,
        input_type="integer",
        label="Number of the next speakers to be shown on the projector",
        help_text="Enter number of the next shown speakers. Choose -1 to show all next speakers.",
        weight=222,
        group="Agenda",
        subgroup="List of speakers",
        validators=(MinValueValidator(-1),),
    )

    yield ConfigVariable(
        name="agenda_countdown_warning_time",
        default_value=0,
        input_type="integer",
        label="Show orange countdown in the last x seconds of speaking time",
        help_text="Enter duration in seconds. Choose 0 to disable warning color.",
        weight=224,
        group="Agenda",
        subgroup="List of speakers",
        validators=(MinValueValidator(0),),
    )

    yield ConfigVariable(
        name="projector_default_countdown",
        default_value=60,
        input_type="integer",
        label="Predefined seconds of new countdowns",
        weight=226,
        group="Agenda",
        subgroup="List of speakers",
    )

    yield ConfigVariable(
        name="agenda_couple_countdown_and_speakers",
        default_value=True,
        input_type="boolean",
        label="Couple countdown with the list of speakers",
        help_text="[Begin speech] starts the countdown, [End speech] stops the countdown.",
        weight=228,
        group="Agenda",
        subgroup="List of speakers",
    )

    yield ConfigVariable(
        name="agenda_enable_point_of_order_speakers",
        default_value=False,
        input_type="boolean",
        label="Enable points of order",
        weight=229,
        group="Agenda",
        subgroup="List of speakers",
    )

    yield ConfigVariable(
        name="agenda_hide_amount_of_speakers",
        default_value=False,
        input_type="boolean",
        label="Hide the amount of speakers in subtitle of list of speakers slide",
        weight=230,
        group="Agenda",
        subgroup="List of speakers",
    )

    yield ConfigVariable(
        name="agenda_present_speakers_only",
        default_value=False,
        input_type="boolean",
        label="Only present participants can be added to the list of speakers",
        weight=232,
        group="Agenda",
        subgroup="List of speakers",
    )

    yield ConfigVariable(
        name="agenda_show_first_contribution",
        default_value=False,
        input_type="boolean",
        label="Show hint »first speech« in the list of speakers management view",
        weight=234,
        group="Agenda",
        subgroup="List of speakers",
    )
