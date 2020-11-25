from django.conf import settings
from django.core.validators import MinValueValidator

from openslides.assignments.models import AssignmentPoll
from openslides.core.config import ConfigVariable


def get_config_variables():
    """
    Generator which yields all config variables of this app.
    They are grouped in 'Ballot and ballot papers' and 'PDF'. The generator has
    to be evaluated during app loading (see apps.py).
    """
    # Voting
    yield ConfigVariable(
        name="assignment_poll_method",
        default_value=AssignmentPoll.POLLMETHOD_Y,
        input_type="choice",
        label="Default election method",
        choices=tuple(
            {"value": method[0], "display_name": method[1]}
            for method in AssignmentPoll.POLLMETHODS
        ),
        weight=400,
        group="Elections",
        subgroup="Ballot",
    )

    if getattr(settings, "ENABLE_ELECTRONIC_VOTING", False):
        assignment_poll_type_choices = tuple(
            {"value": type[0], "display_name": type[1]} for type in AssignmentPoll.TYPES
        )
    else:
        assignment_poll_type_choices = (
            {
                "value": AssignmentPoll.TYPE_ANALOG,
                "display_name": AssignmentPoll.TYPE_ANALOG,
            },
        )

    yield ConfigVariable(
        name="assignment_poll_default_type",
        default_value=AssignmentPoll.TYPE_ANALOG,
        input_type="choice",
        label="Default voting type",
        choices=assignment_poll_type_choices,
        weight=403,
        group="Elections",
        subgroup="Ballot",
    )

    yield ConfigVariable(
        name="assignment_poll_default_100_percent_base",
        default_value=AssignmentPoll.PERCENT_BASE_VALID,
        input_type="choice",
        label="Default 100 % base of an election result",
        choices=tuple(
            {"value": base[0], "display_name": base[1]}
            for base in AssignmentPoll.PERCENT_BASES
        ),
        weight=405,
        group="Elections",
        subgroup="Ballot",
    )

    yield ConfigVariable(
        name="assignment_poll_default_groups",
        default_value=[],
        input_type="groups",
        label="Default groups with voting rights",
        weight=410,
        group="Elections",
        subgroup="Ballot",
    )

    yield ConfigVariable(
        name="assignment_poll_default_majority_method",
        default_value=AssignmentPoll.MAJORITY_SIMPLE,
        input_type="choice",
        choices=tuple(
            {"value": method[0], "display_name": method[1]}
            for method in AssignmentPoll.MAJORITY_METHODS
        ),
        label="Required majority",
        help_text="Default method to check whether a candidate has reached the required majority.",
        weight=415,
        hidden=True,
        group="Elections",
        subgroup="Ballot",
    )

    yield ConfigVariable(
        name="assignment_poll_sort_poll_result_by_votes",
        default_value=True,
        input_type="boolean",
        label="Sort election results by amount of votes",
        weight=420,
        group="Elections",
        subgroup="Ballot",
    )

    yield ConfigVariable(
        name="assignment_poll_add_candidates_to_list_of_speakers",
        default_value=True,
        input_type="boolean",
        label="Put all candidates on the list of speakers",
        weight=425,
        group="Elections",
        subgroup="Ballot",
    )

    # Ballot Paper
    yield ConfigVariable(
        name="assignments_pdf_ballot_papers_selection",
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
        weight=430,
        group="Elections",
        subgroup="Ballot papers",
    )

    yield ConfigVariable(
        name="assignments_pdf_ballot_papers_number",
        default_value=8,
        input_type="integer",
        label="Custom number of ballot papers",
        weight=435,
        group="Elections",
        subgroup="Ballot papers",
        validators=(MinValueValidator(1),),
    )

    # PDF
    yield ConfigVariable(
        name="assignments_pdf_title",
        default_value="Elections",
        label="Title for PDF document (all elections)",
        weight=460,
        group="Elections",
        subgroup="PDF export",
    )

    yield ConfigVariable(
        name="assignments_pdf_preamble",
        default_value="",
        label="Preamble text for PDF document (all elections)",
        weight=470,
        group="Elections",
        subgroup="PDF export",
    )
