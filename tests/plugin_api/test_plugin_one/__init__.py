# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url
from django.views.generic import RedirectView

__verbose_name__ = 'Test Plugin ta3Ohmaiquee2phaf9ei'
__version__ = 'test_version_string_MoHonepahfofiree6Iej'
__description__ = 'Short description of test plugin Sah9aiQuae5hoocai7ai'

urlpatterns = patterns(
    '',
    url(r'^test_plugin_one_url_Eexea4nie1fexaax3oX7/$',
        RedirectView.as_view(pattern_name='core_version', permanent=False)))
