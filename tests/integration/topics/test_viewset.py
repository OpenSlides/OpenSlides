from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.agenda.models import Item
from openslides.core.config import config
from openslides.topics.models import Topic
from openslides.utils.test import TestCase, use_cache


class TestDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some topics are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        for index in range(10):
            Topic.objects.create(title='topic-{}'.format(index))

    @use_cache()
    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 4 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all topics,
        * 1 request to get attachments,
        * 1 request to get the agenda item
        """
        self.client.force_login(get_user_model().objects.get(pk=1))
        with self.assertNumQueries(8):
            self.client.get(reverse('topic-list'))

    @use_cache()
    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 3 requests to get the permission for anonymous,
        * 2 requests to get the list of all topics,
        * 1 request to get attachments,
        * 1 request to get the agenda item,
        """
        with self.assertNumQueries(7):
            self.client.get(reverse('topic-list'))


class TopicCreate(TestCase):
    """
    Tests creation of new topics.
    """
    def setUp(self):
        self.client.login(
            username='admin',
            password='admin',
        )

    def test_simple_create(self):
        response = self.client.post(
            reverse('topic-list'),
            {'title': 'test_title_ahyo1uifoo9Aiph2av5a',
             'text': 'test_text_chu9Uevoo5choo0Xithe'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        topic = Topic.objects.get()
        self.assertEqual(topic.title, 'test_title_ahyo1uifoo9Aiph2av5a')
        self.assertEqual(topic.text, 'test_text_chu9Uevoo5choo0Xithe')
        self.assertEqual(Item.objects.get(), topic.agenda_item)
