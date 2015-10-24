import json

from rest_framework.test import APIClient

from openslides.agenda.models import Item
from openslides.core.models import CustomSlide
from openslides.utils.test import TestCase


class AgendaTreeTest(TestCase):
    def setUp(self):
        CustomSlide.objects.create(title='item1')
        item2 = CustomSlide.objects.create(title='item2').agenda_item
        item3 = CustomSlide.objects.create(title='item2a').agenda_item
        item3.parent = item2
        item3.save()
        self.client = APIClient()
        self.client.login(username='admin', password='admin')

    def test_get(self):
        response = self.client.get('/rest/agenda/item/tree/')

        self.assertEqual(json.loads(response.content.decode()),
                         [{'children': [], 'id': 1},
                          {'children': [{'children': [], 'id': 3}], 'id': 2}])

    def test_set(self):
        tree = [{'id': 3},
                {'children': [{'id': 1}], 'id': 2}]

        response = self.client.put('/rest/agenda/item/tree/', {'tree': tree}, format='json')

        self.assertEqual(response.status_code, 200)

        item1 = Item.objects.get(pk=1)
        item2 = Item.objects.get(pk=2)
        item3 = Item.objects.get(pk=3)
        self.assertEqual(item1.parent_id, 2)
        self.assertEqual(item1.weight, 0)
        self.assertEqual(item2.parent_id, None)
        self.assertEqual(item2.weight, 1)
        self.assertEqual(item3.parent_id, None)
        self.assertEqual(item3.weight, 0)

    def test_set_without_perm(self):
        self.client = APIClient()

        response = self.client.put('/rest/agenda/item/tree/', {'tree': []}, format='json')

        self.assertEqual(response.status_code, 403)

    def test_tree_with_double_item(self):
        """
        Test to send a tree that has an item-pk more then once in it.

        It is expected, that the responsecode 400 is returned with a specific
        content
        """
        tree = [{'id': 1}, {'id': 1}]

        response = self.client.put('/rest/agenda/item/tree/', {'tree': tree}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {'detail': "Item 1 is more then once in the tree."})

    def test_tree_with_empty_children(self):
        """
        Test that the chrildren element is not required in the tree
        """
        tree = [{'id': 1}]

        response = self.client.put('/rest/agenda/item/tree/', {'tree': tree}, format='json')

        self.assertEqual(response.status_code, 200)

    def test_tree_with_unknown_item(self):
        """
        Tests that unknown items lead to an error.
        """
        tree = [{'id': 500}]

        response = self.client.put('/rest/agenda/item/tree/', {'tree': tree}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {'detail': "Item 500 is not in the database."})


class TestAgendaPDF(TestCase):
    def test_get(self):
        """
        Tests that a requst on the pdf-page returns with statuscode 200.
        """
        CustomSlide.objects.create(title='item1')
        self.client.login(username='admin', password='admin')

        response = self.client.get('/agenda/print/')

        self.assertEqual(response.status_code, 200)
