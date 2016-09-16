import uuid

from django.core.urlresolvers import reverse
from rest_framework import status

from openslides.core.config import config
from openslides.core.models import CustomSlide, Projector
from openslides.utils.test import TestCase


class CustomSlideViewSet(TestCase):
    """
    Tests custom slides.
    """
    def setUp(self):
        self.client.login(username='admin', password='admin')
        self.customslide = CustomSlide.objects.create(title='test_agait5TaiTho9ohthah9')

    def test_retrieve(self):
        response = self.client.get(reverse('customslide-detail', args=[self.customslide.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'test_agait5TaiTho9ohthah9')

    def test_retrieve_anonymous(self):
        config['general_system_enable_anonymous'] = True
        self.client.logout()
        response = self.client.get(reverse('customslide-detail', args=[self.customslide.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_anonymous_with_slide_on_projector(self):
        config['general_system_enable_anonymous'] = True
        self.client.logout()
        projector = Projector.objects.get(pk=1)
        projector.config[uuid.uuid4().hex] = {'name': self.customslide.get_collection_string(), 'id': self.customslide.pk}
        projector.save()
        response = self.client.get(reverse('customslide-detail', args=[self.customslide.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'test_agait5TaiTho9ohthah9')
