import json

from django.core.urlresolvers import reverse
from rest_framework import status

from openslides.core.models import CustomSlide, Projector
from openslides.utils.test import TestCase


class ProjectorAPI(TestCase):
    """
    Tests requests from the anonymous user.
    """
    def test_slide_on_default_projector(self):
        self.client.login(username='admin', password='admin')
        customslide = CustomSlide.objects.create(title='title_que1olaish5Wei7que6i', text='text_aishah8Eh7eQuie5ooji')
        default_projector = Projector.objects.get(pk=1)
        default_projector.config = [{'name': 'core/customslide', 'id': customslide.id}]
        default_projector.save()

        response = self.client.get(reverse('projector-detail', args=['1']))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content.decode()), {
            'config': [{'name': 'core/customslide', 'id': customslide.id}],
            'projector_elements': [
                {'name': 'core/customslide',
                 'scripts': 'core/customslide_slide.js',
                 'context': [
                     {'collection': 'core/customslide',
                      'id': customslide.id}]}]})

    def test_invalid_slide_on_default_projector(self):
        self.client.login(username='admin', password='admin')
        default_projector = Projector.objects.get(pk=1)
        default_projector.config = [{'name': 'invalid_slide'}]
        default_projector.save()

        response = self.client.get(reverse('projector-detail', args=['1']))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content.decode()), {
            'config': [{'name': 'invalid_slide'}],
            'projector_elements': [
                {'name': 'invalid_slide',
                 'error': 'Projector element does not exist.'}]})
