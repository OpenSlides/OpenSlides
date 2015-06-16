from django.test.client import Client

from openslides.motions.models import Motion
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

        # Registered
        self.registered = User.objects.create_user('registered', 'registered')
        self.registered_client = Client()
        self.registered_client.login(username='registered', password='registered')

    def test_render_nested_list(self):
        Motion.objects.create(
            title='Test Title chieM6Aing8Eegh9ePhu',
            text='<ul><li>Element 1 aKaesieze6mahR2ielie'
                 '<ul><li>Subelement 1 rel0liiGh0bi3ree6Jei</li>'
                 '<li>Subelement 2 rel0liiGh0bi3ree6Jei</li></ul></li>'
                 '<li>Element 2 rel0liiGh0bi3ree6Jei</li></ul>')
        response = self.admin_client.get('/motions/1/pdf/')
        self.assertEqual(response.status_code, 200)

    def test_get_without_required_permission_from_state(self):
        motion = Motion.objects.create(title='motion_title_zthguis8qqespgknme52')
        motion.state.required_permission_to_see = 'motions.can_manage'
        motion.state.save()
        response = self.registered_client.get('/motions/1/pdf/')
        self.assertEqual(response.status_code, 403)

    def test_get_with_filtered_motion_list(self):
        motion = Motion.objects.create(title='motion_title_qwgvzf6487guni0oikcc')
        motion.state.required_permission_to_see = 'motions.can_manage'
        motion.state.save()
        response = self.registered_client.get('/motions/pdf/')
        self.assertEqual(response.status_code, 200)
