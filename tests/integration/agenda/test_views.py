from openslides.topics.models import Topic
from openslides.utils.test import TestCase


class TestAgendaPDF(TestCase):
    def test_get(self):
        """
        Tests that a requst on the pdf-page returns with statuscode 200.
        """
        Topic.objects.create(title='item1')
        self.client.login(username='admin', password='admin')

        response = self.client.get('/agenda/print/')

        self.assertEqual(response.status_code, 200)
