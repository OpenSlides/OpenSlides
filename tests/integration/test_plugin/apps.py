from django.apps import AppConfig

from . import __description__, __verbose_name__


class TestPluginAppConfig(AppConfig):
    name = 'tests.integration.test_plugin'
    label = 'tests.integration.test_plugin'
    verbose_name = __verbose_name__
    description = __description__
