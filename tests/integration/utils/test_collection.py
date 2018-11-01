from openslides.topics.models import Topic
from openslides.utils import collection
from openslides.utils.test import TestCase


class TestCollectionElementCache(TestCase):
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
