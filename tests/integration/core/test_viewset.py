import pytest
from django.urls import reverse
from rest_framework import status

from openslides.core.config import config
from openslides.core.models import ChatMessage, Projector, Tag
from openslides.users.models import User
from openslides.utils.test import TestCase

from ..helpers import count_queries


@pytest.mark.django_db(transaction=False)
def test_projector_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all projectors,
    * 1 request to get the list of the projector defaults.
    """
    for index in range(10):
        Projector.objects.create(name="Projector{}".format(index))

    assert count_queries(Projector.get_elements) == 2


@pytest.mark.django_db(transaction=False)
def test_chat_message_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all chatmessages.
    """
    user = User.objects.get(username='admin')
    for index in range(10):
        ChatMessage.objects.create(user=user)

    assert count_queries(ChatMessage.get_elements) == 1


@pytest.mark.django_db(transaction=False)
def test_tag_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all tags.
    """
    for index in range(10):
        Tag.objects.create(name='tag{}'.format(index))

    assert count_queries(Tag.get_elements) == 1


@pytest.mark.django_db(transaction=False)
def test_config_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all config values
    """
    config.save_default_values()

    assert count_queries(Tag.get_elements) == 1


class ChatMessageViewSet(TestCase):
    """
    Tests requests to deal with chat messages.
    """
    def setUp(self):
        admin = User.objects.get(username='admin')
        self.client.force_login(admin)
        ChatMessage.objects.create(message='test_message_peechiel8IeZoohaem9e', user=admin)

    def test_clear_chat(self):
        response = self.client.post(reverse('chatmessage-clear'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ChatMessage.objects.all().count(), 0)
