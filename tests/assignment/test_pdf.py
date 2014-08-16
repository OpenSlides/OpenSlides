from django.test.client import Client

from openslides.assignment.models import Assignment
from openslides.participant.models import User
from openslides.utils.test import TestCase


class AssignmentPDFTest(TestCase):
    """
    Tests for assignment PDF.
    """
    def setUp(self):
        # Admin
        self.admin = User.objects.get(pk=1)
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_render_pdf(self):
        Assignment.objects.create(name='assignment_name_ith8qua1Eiferoqu5ju2', description="test", posts=1)
        response = self.admin_client.get('/assignment/print/')
        self.assertEqual(response.status_code, 200)
