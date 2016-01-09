from django.dispatch import receiver

from openslides.core.config import ConfigVariable, config
from openslides.core.exceptions import ConfigError, ConfigNotFound
from openslides.core.signals import config_signal
from openslides.utils.test import TestCase


class HandleConfigTest(TestCase):

    def get_config_var(self, key):
        return config[key]

    def set_config_var(self, key, value):
        config[key] = value

    def test_get_config_default_value(self):
        self.assertEqual(config['string_var'], 'default_string_rien4ooCZieng6ah')
        self.assertTrue(config['bool_var'])
        self.assertEqual(config['integer_var'], 3)
        self.assertEqual(config['choices_var'], '1')
        self.assertEqual(config['none_config_var'], None)
        with self.assertRaisesMessage(
                ConfigNotFound,
                'The config variable unknown_config_var was not found.'):
            self.get_config_var('unknown_config_var')

    def test_get_multiple_config_var_error(self):
        config_signal.connect(
            set_simple_config_view_multiple_vars,
            dispatch_uid='set_simple_config_view_multiple_vars_for_testing')

        with self.assertRaisesMessage(
                ConfigError,
                'Too many values for config variable multiple_config_var found.'):
            config.setup_cache()
        config_signal.disconnect(
            set_simple_config_view_multiple_vars,
            dispatch_uid='set_simple_config_view_multiple_vars_for_testing')

    def test_database_queries(self):
        """
        Test that no database queries are send, after the cache was created.
        """
        config.setup_cache()
        self.assertNumQueries(0, self.get_config_var, key='string_var')

    def test_setup_config_var(self):
        self.assertRaises(TypeError, ConfigVariable)
        self.assertRaises(TypeError, ConfigVariable, name='foo')
        self.assertRaises(TypeError, ConfigVariable, default_value='foo')

    def test_change_config_value(self):
        self.assertEqual(config['string_var'], 'default_string_rien4ooCZieng6ah')
        config['string_var'] = 'other_special_unique_string dauTex9eAiy7jeen'
        self.assertEqual(config['string_var'], 'other_special_unique_string dauTex9eAiy7jeen')

    def test_missing_cache_(self):
        self.assertEqual(config['string_var'], 'default_string_rien4ooCZieng6ah')

    def test_config_contains(self):
        self.assertTrue('string_var' in config)
        self.assertFalse('unknown_config_var' in config)

    def test_set_value_before_getting_it(self):
        """
        Try to call __setitem__ before __getitem__.
        """
        config['additional_config_var'] = 'value'

    def test_on_change(self):
        """
        Tests that the special callback is called and raises a special
        message.
        """
        # TODO: use right exception
        with self.assertRaisesMessage(
                Exception,
                'Change callback dhcnfg34dlg06kdg successfully called.'):
            self.set_config_var(
                key='var_with_callback_ghvnfjd5768gdfkwg0hm2',
                value='new_string_kbmbnfhdgibkdjshg452bc')

        self.assertEqual(
            config['var_with_callback_ghvnfjd5768gdfkwg0hm2'],
            'new_string_kbmbnfhdgibkdjshg452bc')


@receiver(config_signal, dispatch_uid='set_grouped_config_view_for_testing')
def set_grouped_config_view(sender, **kwargs):
    """
    Sets a grouped config collection. There are some variables, one variable
    with a string as default value, one with a boolean as default value,
    one with an integer as default value, one with choices and one hidden
    variable. These variables are grouped in two subgroups.
    """
    yield ConfigVariable(
        name='string_var',
        default_value='default_string_rien4ooCZieng6ah',
        group='Config vars for testing 1',
        subgroup='Group 1 aiYeix2mCieQuae3')
    yield ConfigVariable(
        name='bool_var',
        default_value=True,
        input_type='boolean',
        group='Config vars for testing 1',
        subgroup='Group 1 aiYeix2mCieQuae3')
    yield ConfigVariable(
        name='integer_var',
        default_value=3,
        input_type='integer',
        group='Config vars for testing 1',
        subgroup='Group 1 aiYeix2mCieQuae3')

    yield ConfigVariable(
        name='hidden_var',
        default_value='hidden_value',
        group='Config vars for testing 1',
        subgroup='Group 2 Toongai7ahyahy7B')
    yield ConfigVariable(
        name='choices_var',
        default_value='1',
        input_type='choice',
        choices=(
            {'value': '1', 'display_name': 'Choice One Ughoch4ocoche6Ee'},
            {'value': '2', 'display_name': 'Choice Two Vahnoh5yalohv5Eb'}),
        group='Config vars for testing 1',
        subgroup='Group 2 Toongai7ahyahy7B')


@receiver(config_signal, dispatch_uid='set_simple_config_view_for_testing')
def set_simple_config_view(sender, **kwargs):
    """
    Sets a simple config view with some config variables but without
    grouping.
    """
    yield ConfigVariable(name='additional_config_var', default_value='BaeB0ahcMae3feem')
    yield ConfigVariable(name='additional_config_var_2', default_value='')
    yield ConfigVariable(name='none_config_var', default_value=None)


# Do not connect to the signal now but later inside the test.
def set_simple_config_view_multiple_vars(sender, **kwargs):
    """
    Sets a bad config view with some multiple config vars.
    """
    yield ConfigVariable(name='multiple_config_var', default_value='foobar1')
    yield ConfigVariable(name='multiple_config_var', default_value='foobar2')


@receiver(config_signal, dispatch_uid='set_simple_config_collection_disabled_view_for_testing')
def set_simple_config_collection_disabled_view(sender, **kwargs):
    yield ConfigVariable(name='hidden_config_var_2', default_value='')


@receiver(config_signal, dispatch_uid='set_simple_config_collection_with_callback_for_testing')
def set_simple_config_collection_with_callback(sender, **kwargs):
    def callback():
        raise Exception('Change callback dhcnfg34dlg06kdg successfully called.')
    yield ConfigVariable(
        name='var_with_callback_ghvnfjd5768gdfkwg0hm2',
        default_value='',
        on_change=callback)
