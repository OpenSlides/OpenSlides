from django.core.urlresolvers import reverse
from rest_framework import status

from openslides.core.config import config
from openslides.motions.models import Motion
from openslides.utils.test import TestCase


class AllMotionPDF(TestCase):
    """
    Tests creating a PDF of all motions.
    """
    def setUp(self):
        self.client.login(username='admin', password='admin')
        config['motions_identifier'] = 'manually'
        self.motion = Motion(
            title='test_title_Dik4jaey5ku6axee7Dai',
            text='test_text_Auvie4euf2oang8ahcie')
        self.motion.save()
        self.motion2 = Motion(
            title='test_title_AeTheech6euf9siM8uey',
            text='test_text_Cohsh2egaexae8eebiot',
            identifier='42')
        self.motion2.save()

    def test_pdf_all_motions(self):
        response = self.client.get(reverse('motions_pdf'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
