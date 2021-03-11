from openslides.agenda.models import Item
from openslides.core.config import config
from openslides.topics.models import Topic
from tests.test_case import TestCase


class TestItemManager(TestCase):
    def test_get_root_and_children_db_queries(self):
        """
        Test that get_root_and_children needs only one db query.
        """
        for i in range(10):
            Topic.objects.create(title=f"item{i}")

        with self.assertNumQueries(1):
            Item.objects.get_root_and_children()


class TestListOfSpeakers(TestCase):
    def test_open_if_initial_state_configured_to_be_open(self):
        """
        Test a newly created list of speakers is open if the
        agenda_list_of_speakers_initially_closed configuration variable has
        been set to False.
        """
        config["agenda_list_of_speakers_initially_closed"] = False
        list_of_speakers = Topic.objects.create(
            title="list_of_speakers"
        ).list_of_speakers
        self.assertFalse(list_of_speakers.closed)

    def test_closed_if_initial_state_configured_to_be_closed(self):
        """
        Test a newly created list of speakers is closed if the
        agenda_list_of_speakers_initially_closed configuration variable has
        been set to True.
        """
        config["agenda_list_of_speakers_initially_closed"] = True
        list_of_speakers = Topic.objects.create(
            title="list_of_speakers"
        ).list_of_speakers
        self.assertTrue(list_of_speakers.closed)

    def test_open_if_initial_state_not_configured(self):
        """
        Test a newly created list of speakers is open if the
        agenda_list_of_speakers_initially_closed configuration variable has
        not been set.
        """
        list_of_speakers = Topic.objects.create(
            title="list_of_speakers"
        ).list_of_speakers
        self.assertFalse(list_of_speakers.closed)
