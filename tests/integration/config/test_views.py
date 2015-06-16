from django import forms
from django.core.urlresolvers import reverse
from django.dispatch import receiver
from rest_framework import status
from rest_framework.test import APIClient

from openslides.config.api import ConfigCollection, ConfigVariable, config
from openslides.config.signals import config_signal
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
        self.assertEqual(response.data, {'detail': 'Enter a whole number.'})


@receiver(config_signal, dispatch_uid='set_simple_config_view_integration_config_test')
def set_simple_config_view_integration_config_test(sender, **kwargs):
    """
    Sets a simple config view with some config variables but without
    grouping.
    """
    return ConfigCollection(
        title='Config vars for testing',
        url='test_url_ieXao5Wae5Duoy6Wohtu',
        variables=(ConfigVariable(name='test_var_aeW3Quahkah1phahCheo',
                                  default_value=None),
                   ConfigVariable(name='test_var_Xeiizi7ooH8Thuk5aida',
                                  default_value='',
                                  form_field=forms.CharField()),
                   ConfigVariable(name='test_var_ohhii4iavoh5Phoh5ahg',
                                  default_value=0,
                                  form_field=forms.IntegerField())))
