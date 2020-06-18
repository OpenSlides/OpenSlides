import os
from textwrap import dedent

from openslides.core.config import ConfigVariable


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    They are grouped in 'Sorting' and 'PDF'. The generator has to be evaluated
    during app loading (see apps.py).
    """
    # Sorting
    yield ConfigVariable(
        name="users_sort_by",
        default_value="first_name",
        input_type="choice",
        label="Sort name of participants by",
        choices=(
            {"value": "first_name", "display_name": "Given name"},
            {"value": "last_name", "display_name": "Surname"},
            {"value": "number", "display_name": "Participant number"},
        ),
        weight=510,
        group="Participants",
    )

    yield ConfigVariable(
        name="users_enable_presence_view",
        default_value=False,
        input_type="boolean",
        label="Enable participant presence view",
        weight=511,
        group="Participants",
    )

    yield ConfigVariable(
        name="users_allow_self_set_present",
        default_value=False,
        input_type="boolean",
        label="Allow users to set themselves as present",
        help_text="e.g. for online meetings",
        weight=512,
        group="Participants",
    )

    yield ConfigVariable(
        name="users_activate_vote_weight",
        default_value=False,
        input_type="boolean",
        label="Activate vote weight",
        weight=513,
        group="Participants",
    )

    # PDF

    yield ConfigVariable(
        name="users_pdf_welcometitle",
        default_value="Welcome to OpenSlides",
        label="Title for access data and welcome PDF",
        weight=520,
        group="Participants",
        subgroup="PDF export",
    )

    yield ConfigVariable(
        name="users_pdf_welcometext",
        default_value="[Place for your welcome and help text.]",
        label="Help text for access data and welcome PDF",
        weight=530,
        group="Participants",
        subgroup="PDF export",
    )

    # TODO: Use Django's URLValidator here.
    yield ConfigVariable(
        name="users_pdf_url",
        default_value=os.getenv("INSTANCE_DOMAIN", default="http://example.com:8000"),
        label="System URL",
        help_text="Used for QRCode in PDF of access data.",
        weight=540,
        group="Participants",
        subgroup="PDF export",
    )

    yield ConfigVariable(
        name="users_pdf_wlan_ssid",
        default_value="",
        label="WLAN name (SSID)",
        help_text="Used for WLAN QRCode in PDF of access data.",
        weight=550,
        group="Participants",
        subgroup="PDF export",
    )

    yield ConfigVariable(
        name="users_pdf_wlan_password",
        default_value="",
        label="WLAN password",
        help_text="Used for WLAN QRCode in PDF of access data.",
        weight=560,
        group="Participants",
        subgroup="PDF export",
    )

    yield ConfigVariable(
        name="users_pdf_wlan_encryption",
        default_value="",
        input_type="choice",
        label="WLAN encryption",
        help_text="Used for WLAN QRCode in PDF of access data.",
        choices=(
            {"value": "", "display_name": "---------"},
            {"value": "WEP", "display_name": "WEP"},
            {"value": "WPA", "display_name": "WPA/WPA2"},
            {"value": "nopass", "display_name": "No encryption"},
        ),
        weight=570,
        group="Participants",
        subgroup="PDF export",
    )

    # Email

    yield ConfigVariable(
        name="users_email_sender",
        default_value="OpenSlides",
        input_type="string",
        label="Sender name",
        help_text="The sender address is defined in the OpenSlides server settings and should modified by administrator only.",
        weight=600,
        group="Participants",
        subgroup="Email",
    )

    yield ConfigVariable(
        name="users_email_replyto",
        default_value="",
        input_type="string",
        label="Reply address",
        weight=601,
        group="Participants",
        subgroup="Email",
    )

    yield ConfigVariable(
        name="users_email_subject",
        default_value="OpenSlides access data",
        input_type="string",
        label="Email subject",
        help_text="You can use {event_name} and {username} as placeholder.",
        weight=605,
        group="Participants",
        subgroup="Email",
    )

    yield ConfigVariable(
        name="users_email_body",
        default_value=dedent(
            """\
            Dear {name},

            this is your personal OpenSlides login:

                {url}
                username: {username}
                password: {password}

            This email was generated automatically."""
        ),
        input_type="text",
        label="Email body",
        help_text="Use these placeholders: {name}, {event_name}, {url}, {username}, {password}. The url referrs to the system url.",
        weight=610,
        group="Participants",
        subgroup="Email",
    )
