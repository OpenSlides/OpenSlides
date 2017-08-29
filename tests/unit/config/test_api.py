from unittest import TestCase
from unittest.mock import patch

from openslides.core.config import ConfigVariable, config
from openslides.core.exceptions import ConfigNotFound


class TestConfigVariable(TestCase):
    @patch('openslides.core.config.config', {'test_variable': None})
    def test_default_value_in_data(self):
        """
        Tests, that the default_value attribute is in the 'data' property of
        a ConfigVariable instance.
        """
        config_variable = ConfigVariable('test_variable', 'test_default_value')

        self.assertIn(
            'default_value',
            config_variable.data,
            "Config_varialbe.data should have a key 'default_value'")
        self.assertEqual(
            config_variable.data['default_value'],
            'test_default_value',
            "The value of config_variable.data['default_value'] should be the same "
            "as set as second argument of ConfigVariable()")


class TestConfigHandler(TestCase):
    def test_get_not_found(self):
        config.key_to_id = 'has to be set or there is a db query'
        self.assertRaises(
            ConfigNotFound,
            config.__getitem__,
            'key_leehah4Sho4ee7aCohbn')
