from typing import cast
from unittest import TestCase
from unittest.mock import patch

from openslides.core.config import ConfigVariable, ConfigVariableDict, config
from openslides.core.exceptions import ConfigNotFound


class TestConfigVariable(TestCase):
    @patch("openslides.core.config.config", {"test_variable": None})
    def test_default_value_in_data(self):
        """
        Tests, that the default_value attribute is in the 'data' property of
        a ConfigVariable instance.
        """
        config_variable = ConfigVariable("test_variable", "test_default_value")

        self.assertTrue(
            "defaultValue" in cast(ConfigVariableDict, config_variable.data)
        )
        data = config_variable.data
        self.assertTrue(data)
        self.assertEqual(
            cast(ConfigVariableDict, config_variable.data)["defaultValue"],
            "test_default_value",
            "The value of config_variable.data['defaultValue'] should be the same "
            "as set as second argument of ConfigVariable()",
        )


class TestConfigHandler(TestCase):
    @patch("openslides.core.config.ConfigHandler.save_default_values")
    def test_get_not_found(self, mock_save_default_values):
        self.assertRaises(
            ConfigNotFound, config.__getitem__, "key_leehah4Sho4ee7aCohbn"
        )
