import json

from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides import __version__ as version
from openslides.core.config import ConfigVariable, config
from openslides.core.models import CustomSlide, Projector
from openslides.utils.rest_api import ValidationError
from openslides.utils.test import TestCase


class ProjectorAPI(TestCase):
    """
    Tests requests from the anonymous user.
    """
    def test_slide_on_default_projector(self):
        self.client.login(username='admin', password='admin')
        customslide = CustomSlide.objects.create(title='title_que1olaish5Wei7que6i', text='text_aishah8Eh7eQuie5ooji')
        default_projector = Projector.objects.get(pk=1)
        default_projector.config = {
            'aae4a07b26534cfb9af4232f361dce73': {'name': 'core/customslide', 'id': customslide.id}}
        default_projector.save()

        response = self.client.get(reverse('projector-detail', args=['1']))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content.decode()), {
            'id': 1,
            'elements': {
                'aae4a07b26534cfb9af4232f361dce73':
                    {'id': customslide.id,
                     'uuid': 'aae4a07b26534cfb9af4232f361dce73',
                     'name': 'core/customslide'}},
            'scale': 0,
            'scroll': 0,
            'width': 1024,
            'height': 768})

    def test_invalid_slide_on_default_projector(self):
        self.client.login(username='admin', password='admin')
        default_projector = Projector.objects.get(pk=1)
        default_projector.config = {
            'fc6ef43b624043068c8e6e7a86c5a1b0': {'name': 'invalid_slide'}}
        default_projector.save()

        response = self.client.get(reverse('projector-detail', args=['1']))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content.decode()), {
            'id': 1,
            'elements': {
                'fc6ef43b624043068c8e6e7a86c5a1b0':
                    {'name': 'invalid_slide',
                     'uuid': 'fc6ef43b624043068c8e6e7a86c5a1b0',
                     'error': 'Projector element does not exist.'}},
            'scale': 0,
            'scroll': 0,
            'width': 1024,
            'height': 768})


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
                {'verbose_name': 'OpenSlides Test Plugin',
                 'description': 'This is a test plugin for OpenSlides.',
                 'version': 'unknown'}]})


class ConfigViewSet(TestCase):
    """
    Tests requests to deal with config variables.
    """
    def setUp(self):
        # Save the old value of the config object and add the test values
        # TODO: Can be changed to setUpClass when Django 1.8 is no longer supported
        self._config_values = config.config_variables.copy()
        config.update_config_variables(set_simple_config_view_integration_config_test())

    def tearDown(self):
        # Reset the config variables
        config.config_variables = self._config_values

    def test_retrieve(self):
        self.client.login(username='admin', password='admin')
        config['test_var_aeW3Quahkah1phahCheo'] = 'test_value_Oovoojieme7eephaed2A'
        response = self.client.get(reverse('config-detail', args=['test_var_aeW3Quahkah1phahCheo']))
        self.assertEqual(
            response.data,
            {'key': 'test_var_aeW3Quahkah1phahCheo',
             'value': 'test_value_Oovoojieme7eephaed2A'})

    def test_update(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        response = self.client.put(
            reverse('config-detail', args=['test_var_Xeiizi7ooH8Thuk5aida']),
            {'value': 'test_value_Phohx3oopeichaiTheiw'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(config['test_var_Xeiizi7ooH8Thuk5aida'], 'test_value_Phohx3oopeichaiTheiw')

    def test_update_wrong_datatype(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        response = self.client.put(
            reverse('config-detail', args=['test_var_ohhii4iavoh5Phoh5ahg']),
            {'value': 'test_value_string'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': "Wrong datatype. Expected <class 'int'>, got <class 'str'>."})

    def test_update_wrong_datatype_that_can_be_converted(self):
        """
        Try to send a string that can be converted to an integer to an integer
        field.
        """
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        response = self.client.put(
            reverse('config-detail', args=['test_var_ohhii4iavoh5Phoh5ahg']),
            {'value': '12345'})
        self.assertEqual(response.status_code, 200)

    def test_update_good_choice(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        response = self.client.put(
            reverse('config-detail', args=['test_var_wei0Rei9ahzooSohK1ph']),
            {'value': 'key_2_yahb2ain1aeZ1lea1Pei'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(config['test_var_wei0Rei9ahzooSohK1ph'], 'key_2_yahb2ain1aeZ1lea1Pei')

    def test_update_bad_choice(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        response = self.client.put(
            reverse('config-detail', args=['test_var_wei0Rei9ahzooSohK1ph']),
            {'value': 'test_value_bad_string'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'Invalid input. Choice does not match.'})

    def test_update_validator_ok(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        response = self.client.put(
            reverse('config-detail', args=['test_var_Hi7Oje8Oith7goopeeng']),
            {'value': 'valid_string'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(config['test_var_Hi7Oje8Oith7goopeeng'], 'valid_string')

    def test_update_validator_invalid(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        response = self.client.put(
            reverse('config-detail', args=['test_var_Hi7Oje8Oith7goopeeng']),
            {'value': 'invalid_string'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'Invalid input.'})

    def test_update_only_with_key(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        response = self.client.put(
            reverse('config-detail', args=['test_var_Xeiizi7ooH8Thuk5aida']))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'Invalid input. Config value is missing.'})

    def test_metadata_with_hidden(self):
        self.client.login(username='admin', password='admin')
        response = self.client.options(reverse('config-list'))
        filter_obj = filter(
            lambda item: item['key'] == 'test_var_pud2zah2teeNaiP7IoNa',
            response.data['config_groups'][0]['subgroups'][0]['items'])
        self.assertEqual(len(list(filter_obj)), 0)


def validator_for_testing(value):
    """
    Validator for testing.
    """
    if value == 'invalid_string':
        raise ValidationError({'detail': 'Invalid input.'})


def set_simple_config_view_integration_config_test():
    """
    Sets a simple config view with some config variables but without
    grouping.
    """
    yield ConfigVariable(
        name='test_var_aeW3Quahkah1phahCheo',
        default_value=None,
        label='test_label_aeNahsheu8phahk8taYo')

    yield ConfigVariable(
        name='test_var_Xeiizi7ooH8Thuk5aida',
        default_value='')

    yield ConfigVariable(
        name='test_var_ohhii4iavoh5Phoh5ahg',
        default_value=0,
        input_type='integer')

    yield ConfigVariable(
        name='test_var_wei0Rei9ahzooSohK1ph',
        default_value='key_1_Queit2juchoocos2Vugh',
        input_type='choice',
        choices=(
            {'value': 'key_1_Queit2juchoocos2Vugh', 'display_name': 'label_1_Queit2juchoocos2Vugh'},
            {'value': 'key_2_yahb2ain1aeZ1lea1Pei', 'display_name': 'label_2_yahb2ain1aeZ1lea1Pei'}))

    yield ConfigVariable(
        name='test_var_Hi7Oje8Oith7goopeeng',
        default_value='',
        validators=(validator_for_testing,))

    yield ConfigVariable(
        name='test_var_pud2zah2teeNaiP7IoNa',
        default_value=None,
        label='test_label_xaing7eefaePheePhei6',
        hidden=True)
