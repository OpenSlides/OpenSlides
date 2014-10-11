from django.test.client import Client
from openslides.motion.models import Motion
from openslides.users.models import User
from openslides.utils.test import TestCase


class MotionPDFTest(TestCase):
    """
    Tests for motion PDF.
    """
    def setUp(self):
        # Admin
        self.admin = User.objects.get(pk=1)
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_render_nested_list(self):
        Motion.objects.create(
            title='Test Title chieM6Aing8Eegh9ePhu',
            text='<ul><li>Element 1 aKaesieze6mahR2ielie'
                 '<ul><li>Subelement 1 rel0liiGh0bi3ree6Jei</li>'
                 '<li>Subelement 2 rel0liiGh0bi3ree6Jei</li></ul></li>'
                 '<li>Element 2 rel0liiGh0bi3ree6Jei</li></ul>')
        response = self.admin_client.get('/motion/1/pdf/')
        self.assertEqual(response.status_code, 200)
