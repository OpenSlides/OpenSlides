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
        name="assignment_poll_default_100_percent_base",
        default_value="YNA",
        input_type="choice",
        label="The 100-%-base of an election result consists of",
        choices=tuple(
            {"value": base[0], "display_name": base[1]}
            for base in AssignmentPoll.PERCENT_BASES
        ),
        weight=400,
        group="Elections",
        subgroup="Voting",
    )

    yield ConfigVariable(
        name="assignment_poll_default_majority_method",
        default_value="simple",
        input_type="choice",
        choices=tuple(
            {"value": method[0], "display_name": method[1]}
            for method in AssignmentPoll.MAJORITY_METHODS
        ),
        label="Required majority",
        help_text="Default method to check whether a candidate has reached the required majority.",
        weight=405,
        hidden=True,
        group="Elections",
        subgroup="Voting",
    )

    yield ConfigVariable(
        name="assignment_poll_default_groups",
        default_value=[],
        input_type="groups",
        label="Default groups for named and pseudoanonymous assignment polls",
        weight=410,
        group="Elections",
        subgroup="Voting",
    )

    yield ConfigVariable(
        name="assignment_poll_method",
        default_value="votes",
        input_type="choice",
        label="Preselected poll method",
        choices=tuple(
            {"value": method[0], "display_name": method[1]}
            for method in AssignmentPoll.POLLMETHODS
        ),
        weight=415,
        group="Elections",
        subgroup="Voting",
    )

    yield ConfigVariable(
        name="assignment_poll_add_candidates_to_list_of_speakers",
        default_value=True,
        input_type="boolean",
        label="Put all candidates on the list of speakers",
        weight=420,
        group="Elections",
        subgroup="Voting",
    )

    # Ballot Paper
    yield ConfigVariable(
        name="assignments_pdf_ballot_papers_selection",
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
