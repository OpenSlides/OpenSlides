from django.conf import settings
from django.core.validators import MinValueValidator

from openslides.core.config import ConfigVariable
from openslides.motions.models import MotionPoll

from .models import Workflow


def get_workflow_choices():
    """
    Returns a list of all workflows to be used as choices for the config variable
    'motions_workflow'. Each list item contains the pk and the display name.
    """
    return [
        {"value": str(workflow.pk), "display_name": workflow.name}
        for workflow in Workflow.objects.all()
    ]


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    They are grouped in 'General', 'Amendments', 'Supporters', 'Voting and ballot
    papers' and 'PDF'. The generator has to be evaluated during app loading
    (see apps.py).
    """

    # General
    yield ConfigVariable(
        name="motions_workflow",
        default_value="1",
        input_type="choice",
        label="Workflow of new motions",
        choices=get_workflow_choices,
        weight=310,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_statute_amendments_workflow",
        default_value="1",
        input_type="choice",
        label="Workflow of new statute amendments",
        choices=get_workflow_choices,
        weight=312,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_amendments_workflow",
        default_value="1",
        input_type="choice",
        label="Workflow of new amendments",
        choices=get_workflow_choices,
        weight=314,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_preamble",
        default_value="The assembly may decide:",
        label="Motion preamble",
        weight=320,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_default_line_numbering",
        default_value="outside",
        input_type="choice",
        label="Default line numbering",
        choices=(
            {"value": "outside", "display_name": "outside"},
            {"value": "inline", "display_name": "inline"},
            {"value": "none", "display_name": "Disabled"},
        ),
        weight=322,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_line_length",
        default_value=85,
        input_type="integer",
        label="Line length",
        help_text="The maximum number of characters per line. Relevant when line numbering is enabled. Min: 40",
        weight=323,
        group="Motions",
        validators=(MinValueValidator(40),),
    )

    yield ConfigVariable(
        name="motions_reason_required",
        default_value=False,
        input_type="boolean",
        label="Reason required for creating new motion",
        weight=324,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_disable_text_on_projector",
        default_value=False,
        input_type="boolean",
        label="Hide motion text on projector",
        weight=325,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_disable_reason_on_projector",
        default_value=False,
        input_type="boolean",
        label="Hide reason on projector",
        weight=326,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_disable_recommendation_on_projector",
        default_value=False,
        input_type="boolean",
        label="Hide recommendation on projector",
        weight=327,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_hide_referring_motions",
        default_value=False,
        input_type="boolean",
        label="Hide referring motions",
        weight=328,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_disable_sidebox_on_projector",
        default_value=True,
        input_type="boolean",
        label="Show meta information box below the title on projector",
        weight=329,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_show_sequential_numbers",
        default_value=True,
        input_type="boolean",
        label="Show the sequential number for a motion",
        help_text="In motion list, motion detail and PDF.",
        weight=330,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_recommendations_by",
        default_value="",
        label="Name of recommender",
        help_text="Will be displayed as label before selected recommendation. Use an empty value to disable the recommendation system.",
        weight=332,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_statute_recommendations_by",
        default_value="",
        label="Name of recommender for statute amendments",
        help_text="Will be displayed as label before selected recommendation in statute amendments.",
        weight=333,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_recommendation_text_mode",
        default_value="diff",
        input_type="choice",
        label="Default text version for change recommendations",
        choices=(
            {"value": "original", "display_name": "Original version"},
            {"value": "changed", "display_name": "Changed version"},
            {"value": "diff", "display_name": "Diff version"},
            {"value": "agreed", "display_name": "Final version"},
        ),
        weight=334,
        group="Motions",
    )

    yield ConfigVariable(
        name="motions_motions_sorting",
        default_value="identifier",
        input_type="choice",
        label="Sort motions by",
        choices=(
            {"value": "weight", "display_name": "Call list"},
            {"value": "identifier", "display_name": "Identifier"},
        ),
        weight=335,
        group="Motions",
    )

    # Numbering
    yield ConfigVariable(
        name="motions_identifier",
        default_value="per_category",
        input_type="choice",
        label="Identifier",
        choices=(
            {"value": "per_category", "display_name": "Numbered per category"},
            {"value": "serially_numbered", "display_name": "Serially numbered"},
            {"value": "manually", "display_name": "Set it manually"},
        ),
        weight=340,
        group="Motions",
        subgroup="Numbering",
    )

    yield ConfigVariable(
        name="motions_identifier_min_digits",
        default_value=1,
        input_type="integer",
        label="Number of minimal digits for identifier",
        help_text="Uses leading zeros to sort motions correctly by identifier.",
        weight=342,
        group="Motions",
        subgroup="Numbering",
        validators=(MinValueValidator(1),),
    )

    yield ConfigVariable(
        name="motions_identifier_with_blank",
        default_value=False,
        input_type="boolean",
        label="Allow blank in identifier",
        help_text="Blank between prefix and number, e.g. 'A 001'.",
        weight=344,
        group="Motions",
        subgroup="Numbering",
    )

    # Amendments

    yield ConfigVariable(
        name="motions_statutes_enabled",
        default_value=False,
        input_type="boolean",
        label="Activate statute amendments",
        weight=350,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_enabled",
        default_value=False,
        input_type="boolean",
        label="Activate amendments",
        weight=351,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_main_table",
        default_value=True,
        input_type="boolean",
        label="Show amendments together with motions",
        weight=352,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_prefix",
        default_value="-",
        label="Prefix for the identifier for amendments",
        weight=353,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_text_mode",
        default_value="paragraph",
        input_type="choice",
        label="How to create new amendments",
        choices=(
            {"value": "freestyle", "display_name": "Empty text field"},
            {"value": "fulltext", "display_name": "Edit the whole motion text"},
            {"value": "paragraph", "display_name": "Paragraph-based, Diff-enabled"},
        ),
        weight=354,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_multiple_paragraphs",
        default_value=True,
        input_type="boolean",
        label="Amendments can change multiple paragraphs",
        weight=355,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_of_amendments",
        default_value=False,
        input_type="boolean",
        label="Allow amendments of amendments",
        weight=356,
        group="Motions",
        subgroup="Amendments",
    )

    # Supporters

    yield ConfigVariable(
        name="motions_min_supporters",
        default_value=0,
        input_type="integer",
        label="Number of (minimum) required supporters for a motion",
        help_text="Choose 0 to disable the supporting system.",
        weight=360,
        group="Motions",
        subgroup="Supporters",
        validators=(MinValueValidator(0),),
    )

    yield ConfigVariable(
        name="motions_remove_supporters",
        default_value=False,
        input_type="boolean",
        label="Remove all supporters of a motion if a submitter edits his motion in early state",
        weight=361,
        group="Motions",
        subgroup="Supporters",
    )

    # Voting and ballot papers

    if getattr(settings, "ENABLE_ELECTRONIC_VOTING", False):
        motion_poll_type_choices = tuple(
            {"value": type[0], "display_name": type[1]} for type in MotionPoll.TYPES
        )
    else:
        motion_poll_type_choices = (
            {"value": MotionPoll.TYPE_ANALOG, "display_name": MotionPoll.TYPE_ANALOG},
        )

    yield ConfigVariable(
        name="motion_poll_default_type",
        default_value=MotionPoll.TYPE_ANALOG,
        input_type="choice",
        label="Default voting type",
        choices=motion_poll_type_choices,
        weight=367,
        group="Motions",
        subgroup="Voting and ballot papers",
    )

    yield ConfigVariable(
        name="motion_poll_default_100_percent_base",
        default_value=MotionPoll.PERCENT_BASE_YNA,
        input_type="choice",
        label="Default 100 % base of a voting result",
        choices=tuple(
            {"value": base[0], "display_name": base[1]}
            for base in MotionPoll.PERCENT_BASES
        ),
        weight=370,
        group="Motions",
        subgroup="Voting and ballot papers",
    )

    yield ConfigVariable(
        name="motion_poll_default_majority_method",
        default_value=MotionPoll.MAJORITY_SIMPLE,
        input_type="choice",
        choices=tuple(
            {"value": method[0], "display_name": method[1]}
            for method in MotionPoll.MAJORITY_METHODS
        ),
        label="Required majority",
        help_text="Default method to check whether a motion has reached the required majority.",
        weight=371,
        hidden=True,
        group="Motions",
        subgroup="Voting and ballot papers",
    )

    yield ConfigVariable(
        name="motion_poll_default_groups",
        default_value=[],
        input_type="groups",
        label="Default groups with voting rights",
        weight=372,
        group="Motions",
        subgroup="Voting and ballot papers",
    )

    yield ConfigVariable(
        name="motions_pdf_ballot_papers_selection",
        default_value="CUSTOM_NUMBER",
        input_type="choice",
        label="Number of ballot papers",
        choices=(
            {"value": "NUMBER_OF_DELEGATES", "display_name": "Number of all delegates"},
            {
                "value": "NUMBER_OF_ALL_PARTICIPANTS",
                "display_name": "Number of all participants",
            },
            {
                "value": "CUSTOM_NUMBER",
                "display_name": "Use the following custom number",
            },
        ),
        weight=373,
        group="Motions",
        subgroup="Voting and ballot papers",
    )

    yield ConfigVariable(
        name="motions_pdf_ballot_papers_number",
        default_value=8,
        input_type="integer",
        label="Custom number of ballot papers",
        weight=374,
        group="Motions",
        subgroup="Voting and ballot papers",
        validators=(MinValueValidator(1),),
    )

    # PDF export

    yield ConfigVariable(
        name="motions_export_title",
        default_value="Motions",
        label="Title for PDF documents of motions",
        weight=380,
        group="Motions",
        subgroup="PDF export",
    )

    yield ConfigVariable(
        name="motions_export_preamble",
        default_value="",
        label="Preamble text for PDF documents of motions",
        weight=382,
        group="Motions",
        subgroup="PDF export",
    )

    yield ConfigVariable(
        name="motions_export_submitter_recommendation",
        default_value=False,
        label="Show submitters and recommendation/state in table of contents",
        input_type="boolean",
        weight=384,
        group="Motions",
        subgroup="PDF export",
    )

    yield ConfigVariable(
        name="motions_export_follow_recommendation",
        default_value=False,
        label="Show checkbox to record decision",
        input_type="boolean",
        weight=386,
        group="Motions",
        subgroup="PDF export",
    )
