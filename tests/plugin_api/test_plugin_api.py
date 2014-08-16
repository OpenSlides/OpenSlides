from imp import reload

from django.test.client import Client
from django.test.utils import override_settings
from django.core.urlresolvers import clear_url_caches

from openslides.utils.test import TestCase


@override_settings(INSTALLED_PLUGINS=('tests.plugin_api.test_plugin_one',))
class TestPluginOne(TestCase):
    def setUp(self):
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_version_page(self):
        response = self.admin_client.get('/version/')
        self.assertContains(response, 'Test Plugin ta3Ohmaiquee2phaf9ei')
        self.assertContains(response, '(Short description of test plugin Sah9aiQuae5hoocai7ai)')
        self.assertContains(response, '– Version test_version_string_MoHonepahfofiree6Iej')

    def test_url_patterns(self):
        from openslides import urls
        reload(urls)
        clear_url_caches()
        response = self.admin_client.get('/test_plugin_one_url_Eexea4nie1fexaax3oX7/')
        self.assertRedirects(response, '/version/')


@override_settings(INSTALLED_PLUGINS=('tests.plugin_api.test_plugin_two',))
class TestPluginTwo(TestCase):
    def test_version_page(self):
        admin_client = Client()
        admin_client.login(username='admin', password='admin')
        response = admin_client.get('/version/')
        self.assertContains(response, 'tests.plugin_api.test_plugin_two')
        self.assertContains(response, '– Version unknown')
