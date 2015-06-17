import json

from django.core.urlresolvers import reverse
from rest_framework import status

from openslides import __version__ as version
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
            'id': 1,
            'config': [{'name': 'core/customslide', 'id': customslide.id}],
            'elements': [
                {'name': 'core/customslide',
                 'context': {'id': customslide.id}}]})

    def test_invalid_slide_on_default_projector(self):
        self.client.login(username='admin', password='admin')
        default_projector = Projector.objects.get(pk=1)
        default_projector.config = [{'name': 'invalid_slide'}]
        default_projector.save()

        response = self.client.get(reverse('projector-detail', args=['1']))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content.decode()), {
            'id': 1,
            'config': [{'name': 'invalid_slide'}],
            'elements': [
                {'name': 'invalid_slide',
                 'error': 'Projector element does not exist.'}]})


class VersionView(TestCase):
    """
    Tests the version info view.
    """
    def test_get(self):
        self.client.login(username='admin', password='admin')
        response = self.client.get(reverse('core_version'))
        self.assertEqual(json.loads(response.content.decode()), {
            'openslides_version': version,
            'plugins': [
                {'verbose_name': 'Plugin tests.old.utils',
                 'description': 'Description of plugin tests.old.utils',
                 'version': 'unknown'}]})
