from openslides.agenda.models import Item
from openslides.core.models import CustomSlide
from openslides.utils.test import TestCase


class TestItemManager(TestCase):
    def test_get_root_and_children_db_queries(self):
        """
        Test that get_root_and_children needs only one db query.
        """
        for i in range(10):
            CustomSlide.objects.create(title='item{}'.format(i))

        with self.assertNumQueries(1):
            Item.objects.get_root_and_children()
