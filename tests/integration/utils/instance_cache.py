from unittest.mock import patch

from django.core.cache import caches

from openslides.core.models import CustomSlide
from openslides.users.models import User
from openslides.utils.instance_cache import get_instance, instances_generator
from openslides.utils.test import TestCase as _TestCase


class TestCase(_TestCase):
    """
    Testcase that uses the local mem cache and clears the cache after each test.
    """
    def setUp(self):
        cache = caches['locmem']
        cache.clear()
        self.patch = patch('openslides.utils.instance_cache.cache', cache)
        self.patch.start()

    def tearDown(self):
        self.patch.stop()


class TestGetInstance(TestCase):
    def test_clean_cache(self):
        """
        Tests that the instance is retrieved from the database.

        Currently there are 3 queries needed. This can change in the future, but
        it has to be more then zero.
        """
        CustomSlide.objects.create(title='test cs')

        with self.assertNumQueries(3):
            instance = get_instance('core/customslide', 1)
        self.assertEqual(instance['title'], 'test cs')

    def test_with_cache(self):
        """
        Tests that no db query is used when get_instance is called two times.
        """
        CustomSlide.objects.create(title='test cs')
        get_instance('core/customslide', 1)

        with self.assertNumQueries(0):
            instance = get_instance('core/customslide', 1)
        self.assertEqual(instance['title'], 'test cs')

    def test_non_existing_instance(self):
        with self.assertRaises(CustomSlide.DoesNotExist):
            get_instance('core/customslide', 1)

    def test_with_user_id(self):
        CustomSlide.objects.create(title='test cs')
        instance = get_instance('core/customslide', 1, user=1)
        self.assertEqual(instance['title'], 'test cs')

    def test_with_anonymous_user(self):
        """
        Test to get the instance with the permissions of the anonymous user.

        The anonymous user has not the permission to see custom slide instances
        """
        CustomSlide.objects.create(title='test cs')
        instance = get_instance('core/customslide', 1, user=0)
        self.assertIsNone(instance)

    def test_with_user_object(self):
        """
        There should not be any database query if the object is in the cache and
        get_instance is called with an user object.
        """
        CustomSlide.objects.create(title='test cs')
        get_instance('core/customslide', 1, user=1)
        admin = User.objects.get(pk=1)

        with self.assertNumQueries(0):
            get_instance('core/customslide', 1, user=admin)


class TestInstancesGenerator(TestCase):
    def test_clean_cache(self):
        """
        Tests that the instances are retrieved from the database.

        Currently there are 10 queries needed. This can change in the future,
        but it has to be more then zero.
        """
        CustomSlide.objects.create(title='test cs1')
        CustomSlide.objects.create(title='test cs2')
        CustomSlide.objects.create(title='test cs3')

        with self.assertNumQueries(10):
            instance_list = list(instances_generator('core/customslide'))
        self.assertEqual(len(instance_list), 3)

    def test_with_cache(self):
        """
        Tests that no db query is used when get_instance is called two times.
        """
        CustomSlide.objects.create(title='test cs1')
        CustomSlide.objects.create(title='test cs2')
        CustomSlide.objects.create(title='test cs3')
        list(instances_generator('core/customslide'))

        with self.assertNumQueries(0):
            instance_list = list(instances_generator('core/customslide'))
        self.assertEqual(len(instance_list), 3)

    def test_with_some_objects_in_the_cache(self):
        CustomSlide.objects.create(title='test cs1')
        CustomSlide.objects.create(title='test cs2')
        list(instances_generator('core/customslide'))
        CustomSlide.objects.create(title='test cs3')

        with self.assertNumQueries(0):
            instance_list = list(instances_generator('core/customslide'))
        self.assertEqual(len(instance_list), 3)
