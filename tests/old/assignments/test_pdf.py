from django.test.client import Client

from openslides.assignments.models import Assignment
from openslides.users.models import User
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
        Assignment.objects.create(title='assignment_name_ith8qua1Eiferoqu5ju2', description="test", open_posts=1)
        response = self.admin_client.get('/assignments/print/')
        self.assertEqual(response.status_code, 200)

    def test_render_many_posts(self):
        Assignment.objects.create(title='assignment_name_cohZ9shaipee3Phaing4', description="test", open_posts=20)
        response = self.admin_client.get('/assignments/print/')
        self.assertEqual(response.status_code, 200)
