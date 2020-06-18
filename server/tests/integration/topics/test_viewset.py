import pytest
from django.urls import reverse
from rest_framework import status

from openslides.agenda.models import Item
from openslides.topics.models import Topic
from tests.count_queries import count_queries
from tests.test_case import TestCase


@pytest.mark.django_db(transaction=False)
def test_topic_item_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all topics,
    * 1 request to get attachments,
    * 1 request to get the agenda item
    * 1 request to get the list of speakers
    """
    for index in range(10):
        Topic.objects.create(title=f"topic-{index}")

    assert count_queries(Topic.get_elements)() == 4


class TopicCreate(TestCase):
    """
    Tests creation of new topics.
    """

    def setUp(self):
        self.client.login(username="admin", password="admin")

    def test_simple_create(self):
        response = self.client.post(
            reverse("topic-list"),
            {
                "title": "test_title_ahyo1uifoo9Aiph2av5a",
                "text": "test_text_chu9Uevoo5choo0Xithe",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        topic = Topic.objects.get()
        self.assertEqual(topic.title, "test_title_ahyo1uifoo9Aiph2av5a")
        self.assertEqual(topic.text, "test_text_chu9Uevoo5choo0Xithe")
        self.assertEqual(Item.objects.get(), topic.agenda_item)
