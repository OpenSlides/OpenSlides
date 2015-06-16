from unittest import TestCase
from unittest.mock import patch

from openslides.agenda.models import Item


class ItemTitle(TestCase):
    def test_get_title_without_item_no(self):
        item = Item(title='test_title')
        self.assertEqual(
            item.get_title(),
            'test_title')

    @patch('openslides.agenda.models.Item.item_no', '5')
    def test_get_title_with_item_no(self):
        item = Item(title='test_title')
        self.assertEqual(
            item.get_title(),
            '5 test_title')

    @patch('openslides.agenda.models.Item.content_object')
    def test_get_title_from_related(self, content_object):
        item = Item(title='test_title')
        content_object.get_agenda_title.return_value = 'related_title'

        self.assertEqual(
            item.get_title(),
            'related_title')

    @patch('openslides.agenda.models.Item.content_object')
    def test_get_title_invalid_related(self, content_object):
        item = Item(title='test_title')
        content_object.get_agenda_title.return_value = 'related_title'
        del content_object.get_agenda_title

        with self.assertRaises(NotImplementedError):
            item.get_title()

    def test_title_supplement_without_related(self):
        item = Item()
        self.assertEqual(
            item.get_title_supplement(),
            '')

    @patch('openslides.agenda.models.Item.content_object')
    def test_title_supplement_with_related(self, content_object):
        item = Item()
        content_object.get_agenda_title_supplement.return_value = 'related_title_supplement'

        self.assertEqual(
            item.get_title_supplement(),
            'related_title_supplement')

    @patch('openslides.agenda.models.Item.content_object')
    def test_title_supplement_invalid_related(self, content_object):
        item = Item()
        del content_object.get_agenda_title_supplement

        with self.assertRaises(NotImplementedError):
            item.get_title_supplement()
