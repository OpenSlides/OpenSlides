from django.core.validators import MinValueValidator

from openslides.core.config import ConfigVariable
from openslides.poll.majority import majorityMethods


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    They are grouped in 'Ballot and ballot papers' and 'PDF'. The generator has
    to be evaluated during app loading (see apps.py).
    """
    # Ballot and ballot papers
    yield ConfigVariable(
        name="assignments_poll_100_percent_base",
        default_value="YES_NO_ABSTAIN",
        input_type="choice",
        label="The 100-%-base of an election result consists of",
        choices=(
            {"value": "YES_NO_ABSTAIN", "display_name": "Yes/No/Abstain per candidate"},
            {"value": "YES_NO", "display_name": "Yes/No per candidate"},
            {"value": "VALID", "display_name": "All valid ballots"},
            {"value": "CAST", "display_name": "All casted ballots"},
            {"value": "DISABLED", "display_name": "Disabled (no percents)"},
        ),
        help_text=(
            "For Yes/No/Abstain per candidate and Yes/No per candidate the 100-%-base "
            "depends on the election method: If there is only one option per candidate, "
            "the sum of all votes of all candidates is 100 %. Otherwise for each "
            "candidate the sum of all votes is 100 %."
        ),
        weight=420,
        group="Elections",
        subgroup="Ballot and ballot papers",
    )

    # TODO: Add server side validation of the choices.
    yield ConfigVariable(
        name="assignments_poll_default_majority_method",
        default_value=majorityMethods[0]["value"],
        input_type="choice",
        choices=majorityMethods,
        label="Required majority",
        help_text="Default method to check whether a candidate has reached the required majority.",
        weight=425,
        group="Elections",
        subgroup="Ballot and ballot papers",
    )

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
        subgroup="Ballot and ballot papers",
    )

    yield ConfigVariable(
        name="assignments_pdf_ballot_papers_number",
        default_value=8,
        input_type="integer",
        label="Custom number of ballot papers",
        weight=435,
        group="Elections",
        subgroup="Ballot and ballot papers",
        validators=(MinValueValidator(1),),
    )

    yield ConfigVariable(
        name="assignments_add_candidates_to_list_of_speakers",
        default_value=True,
        input_type="boolean",
        label="Put all candidates on the list of speakers",
        weight=440,
        group="Elections",
        subgroup="Ballot and ballot papers",
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
