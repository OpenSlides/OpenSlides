#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.urls
    ~~~~~~~~~~~~~~~

    Global URL list for OpenSlides.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *
from django.conf import settings
from django.contrib import admin

admin.autodiscover()
handler500 = 'openslides.utils.views.server_error'

urlpatterns = patterns('',
    (r'^admin/', include(admin.site.urls)),
    (r'', include('openslides.agenda.urls')),
    (r'', include('openslides.application.urls')),
    (r'', include('openslides.participant.urls')),
    (r'', include('openslides.assignment.urls')),
    (r'', include('openslides.system.urls')),
    (r'^static/(?P<path>.*)$', 'django.views.static.serve',  {'document_root': settings.STATIC_DOC_ROOT}),
    (r'^i18n/', include('django.conf.urls.i18n')),
)


urlpatterns += patterns('',
    (r'^500/$', 'openslides.utils.views.server_error'),
)
