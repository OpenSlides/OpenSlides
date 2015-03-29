from django.test.client import Client

from openslides.utils.test import TestCase
from openslides.motions.models import Motion
from openslides.config.api import config


class AnonymousRequests(TestCase):
    """
    Tests requests from the anonymous user.
    """
    def setUp(self):
        self.client = Client()
        config['system_enable_anonymous'] = True

    def test_motion_detail(self):
        Motion.objects.create(title='test_motion')

        response = self.client.get('/motions/1/')

        self.assertEqual(response.status_code, 200)
