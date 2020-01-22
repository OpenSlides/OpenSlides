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
        group="Voting",
        subgroup="Elections",
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
        group="Voting",
        subgroup="Elections",
    )

    yield ConfigVariable(
        name="assignment_poll_add_candidates_to_list_of_speakers",
        default_value=True,
        input_type="boolean",
        label="Put all candidates on the list of speakers",
        weight=410,
        group="Voting",
        subgroup="Elections",
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
