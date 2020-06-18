from openslides.agenda.models import Item
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
