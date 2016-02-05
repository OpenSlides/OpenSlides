from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.assignments.models import Assignment
from openslides.utils.test import TestCase


class PDF(TestCase):
    """
    Tests assignment PDF.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.admin = get_user_model().objects.get(username='admin')
        self.assignment = Assignment.objects.create(title='test_assignment_OxieG7BioChahteY4aeM', open_posts=1)

    def test_pdf_with_ballot(self):
        self.assignment.set_candidate(self.admin)
        self.assignment.create_poll()
        self.assignment.polls.all()[0].set_published(True)
        response = self.client.get(reverse('assignments_pdf'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
