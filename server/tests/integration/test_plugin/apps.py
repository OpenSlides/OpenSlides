from django.apps import AppConfig

from . import __description__, __license__, __verbose_name__


class TestPluginAppConfig(AppConfig):
    """
    Test Plugin for the test tests.integration.core.test_views.VersionView
    """

    name = "tests.integration.test_plugin"
    label = "tests.integration.test_plugin"
    verbose_name = __verbose_name__
    description = __description__
    license = __license__
