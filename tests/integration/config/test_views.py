from django.core.urlresolvers import reverse
from django.dispatch import receiver
from rest_framework import status
from rest_framework.test import APIClient

from openslides.config.api import ConfigVariable, config
from openslides.config.signals import config_signal
from openslides.utils.rest_api import ValidationError
from openslides.utils.test import TestCase


class ConfigViewSet(TestCase):
    """
    Tests requests to deal with config variables.
    """
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


def validator_for_testing(value):
    """
    Validator for testing.
    """
    if value == 'invalid_string':
        raise ValidationError({'detail': 'Invalid input.'})


@receiver(config_signal, dispatch_uid='set_simple_config_view_integration_config_test')
def set_simple_config_view_integration_config_test(sender, **kwargs):
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
