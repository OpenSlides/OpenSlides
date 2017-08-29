from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.core.models import ChatMessage, Projector, Tag
from openslides.users.models import User
from openslides.utils.test import TestCase, use_cache


class TestProjectorDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some objects are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        config.save_default_values()
        for index in range(10):
            Projector.objects.create(name="Projector{}".format(index))

    @use_cache()
    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 4 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all projectors,
        * 1 request to get the list of the projector defaults.
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(7):
            self.client.get(reverse('projector-list'))

    @use_cache()
    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 3 requests to get the permission for anonymous,
        * 2 requests to get the list of all projectors,
        * 1 request to get the list of the projector defaults and
        """
        with self.assertNumQueries(6):
            self.client.get(reverse('projector-list'))


class TestCharmessageDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some objects are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        config.save_default_values()
        user = User.objects.get(pk=1)
        for index in range(10):
            ChatMessage.objects.create(user=user)

    @use_cache()
    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 4 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all chatmessages,
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(6):
            self.client.get(reverse('chatmessage-list'))


class TestTagDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some objects are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        config.save_default_values()
        for index in range(10):
            Tag.objects.create(name='tag{}'.format(index))

    @use_cache()
    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 2 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all tags,
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(4):
            self.client.get(reverse('tag-list'))

    @use_cache()
    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 1 requests to see if anonyomus is enabled
        * 2 requests to get the list of all projectors,
        """
        with self.assertNumQueries(3):
            self.client.get(reverse('tag-list'))


class TestConfigDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some objects are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        config.save_default_values()

    @use_cache()
    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 2 requests to get the session an the request user with its permissions and
        * 1 requests to get the list of all config values

        * 1 more that I do not understand
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(4):
            self.client.get(reverse('config-list'))

    @use_cache()
    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 1 requests to see if anonymous is enabled
        * 1 to get all config value and

        * 1 more that I do not understand
        """
        with self.assertNumQueries(3):
            self.client.get(reverse('config-list'))


class ChatMessageViewSet(TestCase):
    """
    Tests requests to deal with chat messages.
    """
    def setUp(self):
        admin = User.objects.get(pk=1)
        self.client.force_login(admin)
        ChatMessage.objects.create(message='test_message_peechiel8IeZoohaem9e', user=admin)

    def test_clear_chat(self):
        response = self.client.post(reverse('chatmessage-clear'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ChatMessage.objects.all().count(), 0)
