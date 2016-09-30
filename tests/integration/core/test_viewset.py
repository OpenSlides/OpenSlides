from django.core.urlresolvers import reverse
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.core.models import ChatMessage, Projector, Tag
from openslides.users.models import User
from openslides.utils.test import TestCase


class TestProjectorDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some objects are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        for index in range(10):
            Projector.objects.create(name="Projector{}".format(index))

    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 5 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all projectors,
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(7):
            self.client.get(reverse('projector-list'))

    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 2 requests to get the permission for anonymous (config and permissions)
        * 2 requests to get the list of all projectors,

        * 11 requests for permissions.

        TODO: The last 11 requests are a bug.
        """
        with self.assertNumQueries(15):
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
        user = User.objects.get(pk=1)
        for index in range(10):
            ChatMessage.objects.create(user=user)

    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 5 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all chatmessages,
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(7):
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
        for index in range(10):
            Tag.objects.create(name='tag{}'.format(index))

    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 2 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all tags,
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(4):
            self.client.get(reverse('tag-list'))

    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 2 requests to get the permission for anonymous (config and permissions)
        * 2 requests to get the list of all projectors,

        * 10 requests for to config

        The last 10 requests are a bug.
        """
        with self.assertNumQueries(14):
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

    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 2 requests to get the session an the request user with its permissions and
        * 1 requests to get the list of all config values
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(3):
            self.client.get(reverse('config-list'))

    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 2 requests to get the permission for anonymous (config and permissions),
        * 1 to get all config value and

        * 57 requests to find out if anonymous is enabled.

        TODO: The last 57 requests are a bug.
        """
        with self.assertNumQueries(60):
            self.client.get(reverse('config-list'))
