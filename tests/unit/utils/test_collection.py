from unittest import TestCase
from unittest.mock import patch

from openslides.core.models import Projector
from openslides.utils import collection


class TestGetModelFromCollectionString(TestCase):
    def test_known_app(self):
        projector_model = collection.get_model_from_collection_string('core/projector')

        self.assertEqual(projector_model, Projector)

    def test_unknown_app(self):
        with self.assertRaises(ValueError):
            collection.get_model_from_collection_string('invalid/model')


class TestCollectionElement(TestCase):
    def test_from_values(self):
        with patch.object(collection.CollectionElement, 'get_full_data'):
            collection_element = collection.CollectionElement.from_values('testmodule/model', 42)

        self.assertEqual(collection_element.collection_string, 'testmodule/model')
        self.assertEqual(collection_element.id, 42)

    def test_channel_message(self):
        """
        Test that to_channel_message works together with from_channel_message.
        """
        collection_element = collection.CollectionElement.from_values(
            'testmodule/model',
            42,
            full_data={'data': 'value'},
            information={'some': 'information'})

        created_collection_element = collection.from_channel_message(
            collection.to_channel_message([collection_element]))[0]

        self.assertEqual(
            collection_element,
            created_collection_element)
        self.assertEqual(created_collection_element.full_data, {'data': 'value'})
        self.assertEqual(created_collection_element.information, {'some': 'information'})

    @patch.object(collection.CollectionElement, 'get_full_data')
    def test_equal(self, mock_get_full_data):
        self.assertEqual(
            collection.CollectionElement.from_values('testmodule/model', 1),
            collection.CollectionElement.from_values('testmodule/model', 1))
        self.assertEqual(
            collection.CollectionElement.from_values('testmodule/model', 1),
            collection.CollectionElement.from_values('testmodule/model', 1, deleted=True))
        self.assertNotEqual(
            collection.CollectionElement.from_values('testmodule/model', 1),
            collection.CollectionElement.from_values('testmodule/model', 2))
        self.assertNotEqual(
            collection.CollectionElement.from_values('testmodule/model', 1),
            collection.CollectionElement.from_values('testmodule/other_model', 1))
