from channels.tests import ChannelTestCase as TestCase
from django_redis import get_redis_connection

from openslides.topics.models import Topic
from openslides.utils import collection


class TestCollectionElementCache(TestCase):
    def test_clean_cache(self):
        """
        Tests that the data is retrieved from the database.
        """
        topic = Topic.objects.create(title='test topic')
        get_redis_connection("default").flushall()

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
        get_redis_connection("default").flushall()

        with self.assertNumQueries(3):
            instance_list = list(topic_collection.get_full_data())
        self.assertEqual(len(instance_list), 3)

    def test_with_cache(self):
        """
        Tests that no db query is used when the list is received twice.
        """
        Topic.objects.create(title='test topic1')
        Topic.objects.create(title='test topic2')
        Topic.objects.create(title='test topic3')
        topic_collection = collection.Collection('topics/topic')
        list(topic_collection.get_full_data())

        with self.assertNumQueries(0):
            instance_list = list(topic_collection.get_full_data())
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
        list(topic_collection.get_full_data())

        topic3.delete()

        with self.assertNumQueries(0):
            instance_list = list(collection.Collection('topics/topic').get_full_data())
        self.assertEqual(len(instance_list), 2)
