from unittest import TestCase
from unittest.mock import MagicMock, patch

from openslides.core.models import Projector
from openslides.utils import collection


class TestCacheKeys(TestCase):
    def test_get_collection_id_from_cache_key(self):
        """
        Test that get_collection_id_from_cache_key works together with
        get_single_element_cache_key.
        """
        element = ('some/testkey', 42)
        self.assertEqual(
            element,
            collection.get_collection_id_from_cache_key(
                collection.get_single_element_cache_key(*element)))

    def test_get_collection_id_from_cache_key_for_strings(self):
        """
        Test get_collection_id_from_cache_key for strings
        """
        element = ('some/testkey', 'my_config_value')
        self.assertEqual(
            element,
            collection.get_collection_id_from_cache_key(
                collection.get_single_element_cache_key(*element)))

    def test_get_single_element_cache_key_prefix(self):
        """
        Tests that the cache prefix is realy a prefix.
        """
        element = ('some/testkey', 42)

        cache_key = collection.get_single_element_cache_key(*element)
        prefix = collection.get_single_element_cache_key_prefix(element[0])

        self.assertTrue(cache_key.startswith(prefix))

    def test_prefix_different_then_list(self):
        """
        Test that the return value of get_single_element_cache_key_prefix is
        something different then get_element_list_cache_key.
        """
        collection_string = 'some/testkey'

        prefix = collection.get_single_element_cache_key_prefix(collection_string)
        list_cache_key = collection.get_element_list_cache_key(collection_string)

        self.assertNotEqual(prefix, list_cache_key)


class TestGetModelFromCollectionString(TestCase):
    def test_known_app(self):
        projector_model = collection.get_model_from_collection_string('core/projector')

        self.assertEqual(projector_model, Projector)

    def test_unknown_app(self):
        with self.assertRaises(ValueError):
            collection.get_model_from_collection_string('invalid/model')


class TestCollectionElement(TestCase):
    def test_from_values(self):
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42)

        self.assertEqual(collection_element.collection_string, 'testmodule/model')
        self.assertEqual(collection_element.id, 42)

    @patch('openslides.utils.collection.Collection')
    @patch('openslides.utils.collection.cache')
    def test_from_values_deleted(self, mock_cache, mock_collection):
        """
        Tests that when createing a CollectionElement with deleted=True the element
        is deleted from the cache.
        """
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42, deleted=True)

        self.assertTrue(collection_element.is_deleted())
        mock_cache.delete.assert_called_with('testmodule/model:42')
        mock_collection.assert_called_with('testmodule/model')
        mock_collection().delete_id_from_cache.assert_called_with(42)

    def test_as_channel_message(self):
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42)

        self.assertEqual(
            collection_element.as_channels_message(),
            {'collection_string': 'testmodule/model',
             'id': 42,
             'deleted': False,
             'information': {}})

    def test_as_autoupdate_for_user(self):
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42)
        fake_user = MagicMock()
        collection_element.get_access_permissions = MagicMock()
        collection_element.get_access_permissions().get_restricted_data.return_value = 'restricted_data'
        collection_element.get_full_data = MagicMock()

        self.assertEqual(
            collection_element.as_autoupdate_for_user(fake_user),
            {'collection': 'testmodule/model',
             'id': 42,
             'action': 'changed',
             'data': 'restricted_data'})
        collection_element.get_full_data.assert_called_once_with()

    def test_as_autoupdate_for_user_no_permission(self):
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42)
        fake_user = MagicMock()
        collection_element.get_access_permissions = MagicMock()
        collection_element.get_access_permissions().get_restricted_data.return_value = None
        collection_element.get_full_data = MagicMock()

        self.assertEqual(
            collection_element.as_autoupdate_for_user(fake_user),
            {'collection': 'testmodule/model',
             'id': 42,
             'action': 'deleted'})
        collection_element.get_full_data.assert_called_once_with()

    def test_as_autoupdate_for_user_deleted(self):
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42, deleted=True)
        fake_user = MagicMock()

        self.assertEqual(
            collection_element.as_autoupdate_for_user(fake_user),
            {'collection': 'testmodule/model',
             'id': 42,
             'action': 'deleted'})

    def test_get_instance_deleted(self):
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42, deleted=True)

        with self.assertRaises(RuntimeError):
            collection_element.get_instance()

    @patch('openslides.core.config.config')
    def test_get_instance_config_str(self, mock_config):
        mock_config.get_collection_string.return_value = 'core/config'
        mock_config.__getitem__.return_value = 'config_value'
        collection_element = collection.CollectionElement.from_values('core/config', 'my_config_value')

        instance = collection_element.get_instance()

        self.assertEqual(
            instance,
            {'key': 'my_config_value',
             'value': 'config_value'})

    def test_get_instance(self):
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42)
        collection_element.get_model = MagicMock()

        collection_element.get_instance()

        collection_element.get_model().objects.get_full_queryset().get.assert_called_once_with(pk=42)

    @patch('openslides.utils.collection.cache')
    def test_get_full_data_already_loaded(self, mock_cache):
        """
        Test that the cache and the self.get_instance() is not hit, when the
        instance is already loaded.
        """
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42)
        collection_element.full_data = 'my_full_data'
        collection_element.get_instance = MagicMock()

        collection_element.get_full_data()

        mock_cache.get.assert_not_called()
        collection_element.get_instance.assert_not_called()

    @patch('openslides.utils.collection.cache')
    def test_get_full_data_from_cache(self, mock_cache):
        """
        Test that the value from the cache is used not get_instance is not
        called.
        """
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42)
        collection_element.get_instance = MagicMock()
        mock_cache.get.return_value = 'cache_value'

        instance = collection_element.get_full_data()

        self.assertEqual(instance, 'cache_value')
        mock_cache.get.assert_called_once_with('testmodule/model:42')
        collection_element.get_instance.assert_not_called

    @patch('openslides.utils.collection.Collection')
    @patch('openslides.utils.collection.cache')
    def test_get_full_data_from_get_instance(self, mock_cache, mock_Collection):
        """
        Test that the value from get_instance is used and saved to the cache
        """
        collection_element = collection.CollectionElement.from_values('testmodule/model', 42)
        collection_element.get_instance = MagicMock()
        collection_element.get_access_permissions = MagicMock()
        collection_element.get_access_permissions().get_full_data.return_value = 'get_instance_value'
        mock_cache.get.return_value = None

        instance = collection_element.get_full_data()

        self.assertEqual(instance, 'get_instance_value')
        mock_cache.get.assert_called_once_with('testmodule/model:42')
        collection_element.get_instance.assert_called_once_with()
        mock_cache.set.assert_called_once_with('testmodule/model:42', 'get_instance_value')
        mock_Collection.assert_called_once_with('testmodule/model')
        mock_Collection().add_id_to_cache.assert_called_once_with(42)

    def test_equal(self):
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


class TestCollection(TestCase):
    @patch('openslides.utils.collection.CollectionElement')
    @patch('openslides.utils.collection.cache')
    def test_element_generator(self, mock_cache, mock_CollectionElement):
        """
        Test with the following scenario: The collection has three elements. Two
        are in the cache and one is not.
        """
        test_collection = collection.Collection('testmodule/model')
        test_collection.get_all_ids = MagicMock(return_value=set([1, 2, 3]))
        test_collection.get_model = MagicMock()
        test_collection.get_model().objects.get_full_queryset().filter.return_value = ['my_instance']
        mock_cache.get_many.return_value = {
            'testmodule/model:1': 'element1',
            'testmodule/model:2': 'element2'}

        list(test_collection.element_generator())

        mock_cache.get_many.assert_called_once_with(
            ['testmodule/model:1', 'testmodule/model:2', 'testmodule/model:3'])
        test_collection.get_model().objects.get_full_queryset().filter.assert_called_once_with(pk__in={3})
        self.assertEqual(mock_CollectionElement.from_values.call_count, 2)
        self.assertEqual(mock_CollectionElement.from_instance.call_count, 1)
