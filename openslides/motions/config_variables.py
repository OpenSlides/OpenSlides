from django.core.validators import MinValueValidator

from openslides.core.config import ConfigVariable
from openslides.poll.majority import majorityMethods

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
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_statute_amendments_workflow",
        default_value="1",
        input_type="choice",
        label="Workflow of new statute amendments",
        choices=get_workflow_choices,
        weight=312,
        group="Motions",
        subgroup="General",
    )

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
        weight=315,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_preamble",
        default_value="The assembly may decide:",
        label="Motion preamble",
        weight=320,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_default_line_numbering",
        default_value="none",
        input_type="choice",
        label="Default line numbering",
        choices=(
            {"value": "outside", "display_name": "outside"},
            {"value": "inline", "display_name": "inline"},
            {"value": "none", "display_name": "Disabled"},
        ),
        weight=322,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_line_length",
        default_value=90,
        input_type="integer",
        label="Line length",
        help_text="The maximum number of characters per line. Relevant when line numbering is enabled. Min: 40",
        weight=323,
        group="Motions",
        subgroup="General",
        validators=(MinValueValidator(40),),
    )

    yield ConfigVariable(
        name="motions_reason_required",
        default_value=False,
        input_type="boolean",
        label="Reason required for creating new motion",
        weight=324,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_disable_reason_on_projector",
        default_value=False,
        input_type="boolean",
        label="Hide reason on projector",
        weight=325,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_disable_sidebox_on_projector",
        default_value=False,
        input_type="boolean",
        label="Hide meta information box on projector",
        weight=326,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_disable_recommendation_on_projector",
        default_value=False,
        input_type="boolean",
        label="Hide recommendation on projector",
        weight=327,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_recommendations_by",
        default_value="",
        label="Name of recommender",
        help_text="Will be displayed as label before selected recommendation. Use an empty value to disable the recommendation system.",
        weight=332,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_statute_recommendations_by",
        default_value="",
        label="Name of recommender for statute amendments",
        help_text="Will be displayed as label before selected recommendation in statute amendments. "
        + "Use an empty value to disable the recommendation system for statute amendments.",
        weight=333,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_recommendation_text_mode",
        default_value="original",
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
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_category_sorting",
        default_value="prefix",
        input_type="choice",
        label="Sort categories by",
        choices=(
            {"value": "prefix", "display_name": "Prefix"},
            {"value": "name", "display_name": "Name"},
        ),
        weight=335,
        group="Motions",
        subgroup="General",
    )

    yield ConfigVariable(
        name="motions_motions_sorting",
        default_value="identifier",
        input_type="choice",
        label="Sort motions by",
        choices=(
            {"value": "callListWeight", "display_name": "Call list"},
            {"value": "identifier", "display_name": "Identifier"},
        ),
        weight=335,
        group="Motions",
        subgroup="General",
    )

    # Amendments

    yield ConfigVariable(
        name="motions_statutes_enabled",
        default_value=False,
        input_type="boolean",
        label="Activate statute amendments",
        weight=338,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_enabled",
        default_value=False,
        input_type="boolean",
        label="Activate amendments",
        weight=339,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_main_table",
        default_value=False,
        input_type="boolean",
        label="Show amendments together with motions",
        weight=340,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_prefix",
        default_value="-",
        label="Prefix for the identifier for amendments",
        weight=341,
        group="Motions",
        subgroup="Amendments",
    )

    yield ConfigVariable(
        name="motions_amendments_text_mode",
        default_value="freestyle",
        input_type="choice",
        label="How to create new amendments",
        choices=(
            {"value": "freestyle", "display_name": "Empty text field"},
            {"value": "fulltext", "display_name": "Edit the whole motion text"},
            {"value": "paragraph", "display_name": "Paragraph-based, Diff-enabled"},
        ),
        weight=342,
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
        weight=345,
        group="Motions",
        subgroup="Supporters",
        validators=(MinValueValidator(0),),
    )

    yield ConfigVariable(
        name="motions_remove_supporters",
        default_value=False,
        input_type="boolean",
        label="Remove all supporters of a motion if a submitter edits his motion in early state",
        weight=350,
        group="Motions",
        subgroup="Supporters",
    )

    # Voting and ballot papers

    yield ConfigVariable(
        name="motions_poll_100_percent_base",
        default_value="YES_NO_ABSTAIN",
        input_type="choice",
        label="The 100 % base of a voting result consists of",
        choices=(
            {"value": "YES_NO_ABSTAIN", "display_name": "Yes/No/Abstain"},
            {"value": "YES_NO", "display_name": "Yes/No"},
            {"value": "VALID", "display_name": "All valid ballots"},
            {"value": "CAST", "display_name": "All casted ballots"},
            {"value": "DISABLED", "display_name": "Disabled (no percents)"},
        ),
        weight=355,
        group="Motions",
        subgroup="Voting and ballot papers",
    )

    # TODO: Add server side validation of the choices.
    yield ConfigVariable(
        name="motions_poll_default_majority_method",
        default_value=majorityMethods[0]["value"],
        input_type="choice",
        choices=majorityMethods,
        label="Required majority",
        help_text="Default method to check whether a motion has reached the required majority.",
        weight=357,
        group="Motions",
        subgroup="Voting and ballot papers",
    )

    yield ConfigVariable(
        name="motions_pdf_ballot_papers_selection",
        default_value="CUSTOM_NUMBER",
        input_type="choice",
        label="Number of ballot papers (selection)",
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
        weight=360,
        group="Motions",
        subgroup="Voting and ballot papers",
    )

    yield ConfigVariable(
        name="motions_pdf_ballot_papers_number",
        default_value=8,
        input_type="integer",
        label="Custom number of ballot papers",
        weight=365,
        group="Motions",
        subgroup="Voting and ballot papers",
        validators=(MinValueValidator(1),),
    )

    # PDF and DOCX export

    yield ConfigVariable(
        name="motions_export_title",
        default_value="Motions",
        label="Title for PDF and DOCX documents (all motions)",
        weight=370,
        group="Motions",
        subgroup="Export",
    )

    yield ConfigVariable(
        name="motions_export_preamble",
        default_value="",
        label="Preamble text for PDF and DOCX documents (all motions)",
        weight=375,
        group="Motions",
        subgroup="Export",
    )
