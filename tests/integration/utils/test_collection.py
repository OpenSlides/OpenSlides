from unittest.mock import patch

from channels.tests import ChannelTestCase
from django.core.cache import caches

from openslides.topics.models import Topic
from openslides.utils import collection


class TestCase(ChannelTestCase):
    """
    Testcase that uses the local mem cache and clears the cache after each test.
    """
    def setUp(self):
        cache = caches['locmem']
        cache.clear()
        self.patch = patch('openslides.utils.collection.cache', cache)
        self.patch.start()

    def tearDown(self):
        self.patch.stop()


class TestCollectionElementCache(TestCase):
    def test_clean_cache(self):
        """
        Tests that the data is retrieved from the database.
        """
        topic = Topic.objects.create(title='test topic')
        caches['locmem'].clear()

        with self.assertNumQueries(3):
            collection_element = collection.CollectionElement.from_values('topics/topic', 1)
            instance = collection_element.get_full_data()

        self.assertEqual(topic.title, instance['title'])

    def test_with_cache(self):
        """
        Tests that no db query is used when the valie is in the cache.

        The value is added to the test when .create(...) is called. This hits
        the autoupdate system, which fills the cache.
        """
        topic = Topic.objects.create(title='test topic')
        collection_element = collection.CollectionElement.from_values('topics/topic', 1)

        with self.assertNumQueries(0):
            collection_element = collection.CollectionElement.from_values('topics/topic', 1)
            instance = collection_element.get_full_data()
        self.assertEqual(topic.title, instance['title'])

    @patch('openslides.utils.collection.cache')
    def test_save_to_cache_called_once(self, mock_cache):
        """
        Makes sure, that save_to_cache ins called (only) once, if CollectionElement
        is created with "from_instance()".
        """
        topic = Topic.objects.create(title='test topic')
        mock_cache.set.reset_mock()
        collection.CollectionElement.from_instance(topic)

        # cache.set() is called two times. Once for the object and once for the collection.
        self.assertEqual(mock_cache.set.call_count, 2)

    def test_fail_early(self):
        """
        Tests that a CollectionElement.from_values fails, if the object does
        not exist.
        """
        with self.assertRaises(Topic.DoesNotExist):
            collection.CollectionElement.from_values('topics/topic', 999)


class TestCollectionCache(TestCase):
    def test_clean_cache(self):
        """
        Tests that the instances are retrieved from the database.
        """
        Topic.objects.create(title='test topic1')
        Topic.objects.create(title='test topic2')
        Topic.objects.create(title='test topic3')
        topic_collection = collection.Collection('topics/topic')
        caches['locmem'].clear()

        with self.assertNumQueries(4):
            instance_list = list(topic_collection.as_autoupdate_for_projector())
        self.assertEqual(len(instance_list), 3)

    def test_with_cache(self):
        """
        Tests that no db query is used when the list is received twice.
        """
        Topic.objects.create(title='test topic1')
        Topic.objects.create(title='test topic2')
        Topic.objects.create(title='test topic3')
        topic_collection = collection.Collection('topics/topic')
        list(topic_collection.as_autoupdate_for_projector())

        with self.assertNumQueries(0):
            instance_list = list(topic_collection.as_autoupdate_for_projector())
        self.assertEqual(len(instance_list), 3)

    def test_with_some_objects_in_the_cache(self):
        """
        One element (topic3) is in the cache and two are not.
        """
        Topic.objects.create(title='test topic1')
        Topic.objects.create(title='test topic2')
        caches['locmem'].clear()
        Topic.objects.create(title='test topic3')
        topic_collection = collection.Collection('topics/topic')

        with self.assertNumQueries(4):
            instance_list = list(topic_collection.as_autoupdate_for_projector())
        self.assertEqual(len(instance_list), 3)

    def test_deletion(self):
        """
        When an element is deleted, the cache should be updated automaticly via
        the autoupdate system. So there should be no db queries.
        """
        Topic.objects.create(title='test topic1')
        Topic.objects.create(title='test topic2')
        topic3 = Topic.objects.create(title='test topic3')
        topic_collection = collection.Collection('topics/topic')
        list(topic_collection.as_autoupdate_for_projector())

        topic3.delete()

        with self.assertNumQueries(0):
            instance_list = list(topic_collection.as_autoupdate_for_projector())
        self.assertEqual(len(instance_list), 2)

    def test_config_elements_without_cache(self):
        topic_collection = collection.Collection('core/config')
        caches['locmem'].clear()

        with self.assertNumQueries(1):
            list(topic_collection.as_autoupdate_for_projector())

    def test_config_elements_with_cache(self):
        topic_collection = collection.Collection('core/config')
        list(topic_collection.as_autoupdate_for_projector())

        with self.assertNumQueries(0):
            list(topic_collection.as_autoupdate_for_projector())
