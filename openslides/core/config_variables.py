import uuid

from django.core.validators import MaxLengthValidator

from openslides.core.config import ConfigVariable


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    There are two main groups: 'General' and 'Projector'. The group 'General'
    has subgroups. The generator has to be evaluated during app loading
    (see apps.py).
    """
    yield ConfigVariable(
        name="general_event_name",
        default_value="OpenSlides",
        label="Event name",
        weight=110,
        group="General",
        subgroup="Event",
        validators=(MaxLengthValidator(100),),
    )

    yield ConfigVariable(
        name="general_event_description",
        default_value="Presentation and assembly system",
        label="Short description of event",
        weight=115,
        group="General",
        subgroup="Event",
        validators=(MaxLengthValidator(100),),
    )

    yield ConfigVariable(
        name="general_event_date",
        default_value="",
        input_type="datetimepicker",
        label="Event date",
        weight=120,
        group="General",
        subgroup="Event",
    )

    yield ConfigVariable(
        name="general_event_location",
        default_value="",
        label="Event location",
        weight=125,
        group="General",
        subgroup="Event",
    )

    yield ConfigVariable(
        name="general_event_legal_notice",
        default_value='<a href="http://www.openslides.org">OpenSlides</a> is a '
        "free web based presentation and assembly system for "
        "visualizing and controlling agenda, motions and "
        "elections of an assembly.",
        input_type="markupText",
        label="Legal notice",
        weight=132,
        group="General",
        subgroup="Event",
    )

    yield ConfigVariable(
        name="general_event_privacy_policy",
        default_value="",
        input_type="markupText",
        label="Privacy policy",
        weight=132,
        group="General",
        subgroup="Event",
    )

    yield ConfigVariable(
        name="general_event_welcome_title",
        default_value="Welcome to OpenSlides",
        label="Front page title",
        weight=134,
        group="General",
        subgroup="Event",
    )

    yield ConfigVariable(
        name="general_event_welcome_text",
        default_value="[Space for your welcome text.]",
        input_type="markupText",
        label="Front page text",
        weight=136,
        group="General",
        subgroup="Event",
    )

    # General System

    yield ConfigVariable(
        name="general_system_enable_anonymous",
        default_value=False,
        input_type="boolean",
        label="Allow access for anonymous guest users",
        weight=138,
        group="General",
        subgroup="System",
    )

    yield ConfigVariable(
        name="general_login_info_text",
        default_value="",
        label="Show this text on the login page",
        weight=140,
        group="General",
        subgroup="System",
    )

    yield ConfigVariable(
        name="openslides_theme",
        default_value="openslides-theme",
        input_type="choice",
        label="OpenSlides Theme",
        choices=(
            {"value": "openslides-theme", "display_name": "OpenSlides Default"},
            {"value": "openslides-dark-theme", "display_name": "OpenSlides Dark"},
            {"value": "openslides-green-theme", "display_name": "OpenSlides Green"},
            {
                "value": "openslides-developer-dark-theme",
                "display_name": "OpenSlides Developer",
            },
        ),
        weight=141,
        group="General",
        subgroup="System",
    )

    # General export settings

    yield ConfigVariable(
        name="general_csv_separator",
        default_value=",",
        label="Separator used for all csv exports and examples",
        weight=160,
        group="General",
        subgroup="Export",
    )

    yield ConfigVariable(
        name="general_csv_encoding",
        default_value="utf-8",
        input_type="choice",
        label="Default encoding for all csv exports",
        choices=(
            {"value": "utf-8", "display_name": "UTF-8"},
            {"value": "iso-8859-15", "display_name": "ISO-8859-15"},
        ),
        weight=162,
        group="General",
        subgroup="Export",
    )

    yield ConfigVariable(
        name="general_export_pdf_pagenumber_alignment",
        default_value="center",
        input_type="choice",
        label="Page number alignment in PDF",
        choices=(
            {"value": "left", "display_name": "Left"},
            {"value": "center", "display_name": "Center"},
            {"value": "right", "display_name": "Right"},
        ),
        weight=164,
        group="General",
        subgroup="Export",
    )

    yield ConfigVariable(
        name="general_export_pdf_fontsize",
        default_value="10",
        input_type="choice",
        label="Standard font size in PDF",
        choices=(
            {"value": "10", "display_name": "10"},
            {"value": "11", "display_name": "11"},
            {"value": "12", "display_name": "12"},
        ),
        weight=166,
        group="General",
        subgroup="Export",
    )

    yield ConfigVariable(
        name="general_export_pdf_pagesize",
        default_value="A4",
        input_type="choice",
        label="Standard page size in PDF",
        choices=(
            {"value": "A4", "display_name": "DIN A4"},
            {"value": "A5", "display_name": "DIN A5"},
        ),
        weight=168,
        group="General",
        subgroup="Export",
    )

    # Logos
    yield ConfigVariable(
        name="logos_available",
        default_value=[
            "logo_projector_main",
            "logo_projector_header",
            "logo_web_header",
            "logo_pdf_header_L",
            "logo_pdf_header_R",
            "logo_pdf_footer_L",
            "logo_pdf_footer_R",
            "logo_pdf_ballot_paper",
        ],
        weight=300,
        group="Logo",
        hidden=True,
    )

    yield ConfigVariable(
        name="logo_projector_main",
        default_value={"display_name": "Projector logo", "path": ""},
        input_type="static",
        weight=301,
        group="Logo",
        hidden=True,
    )

    yield ConfigVariable(
        name="logo_projector_header",
        default_value={"display_name": "Projector header image", "path": ""},
        input_type="static",
        weight=302,
        group="Logo",
        hidden=True,
    )

    yield ConfigVariable(
        name="logo_web_header",
        default_value={"display_name": "Web interface header logo", "path": ""},
        input_type="static",
        weight=303,
        group="Logo",
        hidden=True,
    )

    # PDF logos
    yield ConfigVariable(
        name="logo_pdf_header_L",
        default_value={"display_name": "PDF header logo (left)", "path": ""},
        input_type="static",
        weight=310,
        group="Logo",
        hidden=True,
    )

    yield ConfigVariable(
        name="logo_pdf_header_R",
        default_value={"display_name": "PDF header logo (right)", "path": ""},
        input_type="static",
        weight=311,
        group="Logo",
        hidden=True,
    )

    yield ConfigVariable(
        name="logo_pdf_footer_L",
        default_value={"display_name": "PDF footer logo (left)", "path": ""},
        input_type="static",
        weight=312,
        group="Logo",
        hidden=True,
    )

    yield ConfigVariable(
        name="logo_pdf_footer_R",
        default_value={"display_name": "PDF footer logo (right)", "path": ""},
        input_type="static",
        weight=313,
        group="Logo",
        hidden=True,
    )

    yield ConfigVariable(
        name="logo_pdf_ballot_paper",
        default_value={"display_name": "PDF ballot paper logo", "path": ""},
        input_type="static",
        weight=314,
        group="Logo",
        hidden=True,
    )

    # Fonts
    yield ConfigVariable(
        name="fonts_available",
        default_value=["font_regular", "font_italic", "font_bold", "font_bold_italic"],
        weight=320,
        group="Font",
        hidden=True,
    )

    yield ConfigVariable(
        name="font_regular",
        default_value={
            "display_name": "Font regular",
            "default": "assets/fonts/fira-sans-latin-400.woff",
            "path": "",
        },
        input_type="static",
        weight=321,
        group="Font",
        hidden=True,
    )

    yield ConfigVariable(
        name="font_italic",
        default_value={
            "display_name": "Font italic",
            "default": "assets/fonts/fira-sans-latin-400italic.woff",
            "path": "",
        },
        input_type="static",
        weight=321,
        group="Font",
        hidden=True,
    )

    yield ConfigVariable(
        name="font_bold",
        default_value={
            "display_name": "Font bold",
            "default": "assets/fonts/fira-sans-latin-500.woff",
            "path": "",
        },
        input_type="static",
        weight=321,
        group="Font",
        hidden=True,
    )

    yield ConfigVariable(
        name="font_bold_italic",
        default_value={
            "display_name": "Font bold italic",
            "default": "assets/fonts/fira-sans-latin-500italic.woff",
            "path": "",
        },
        input_type="static",
        weight=321,
        group="Font",
        hidden=True,
    )

    # Custom translations
    yield ConfigVariable(
        name="translations",
        label="Custom translations",
        default_value=[],
        input_type="translations",
        weight=1000,
        group="Custom translations",
    )

    # Config version and DB id
    yield ConfigVariable(
        name="config_version",
        input_type="integer",
        default_value=1,
        group="Version",
        hidden=True,
    )
    yield ConfigVariable(
        name="db_id",
        input_type="string",
        default_value=uuid.uuid4().hex,
        group="Version",
        hidden=True,
    )
