from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.urlresolvers import reverse
from django_redis import get_redis_connection
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.mediafiles.models import Mediafile
from openslides.users.models import User
from openslides.utils.test import TestCase


class TestDBQueries(TestCase):
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
            Mediafile.objects.create(
                title='some_file{}'.format(index),
                mediafile=SimpleUploadedFile(
                    'some_file{}'.format(index),
                    b'some content.'))

    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 7 requests to get the session an the request user with its permissions and
        * 1 requests to get the list of all files.
        """
        self.client.force_login(User.objects.get(pk=1))
        get_redis_connection('default').flushall()
        with self.assertNumQueries(8):
            self.client.get(reverse('mediafile-list'))

    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 3 requests to get the permission for anonymous and
        * 1 requests to get the list of all projectors.
        """
        get_redis_connection('default').flushall()
        with self.assertNumQueries(4):
            self.client.get(reverse('mediafile-list'))
