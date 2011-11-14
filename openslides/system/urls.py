#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.system.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the system app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *

urlpatterns = patterns('system.views',
    url(r'^config/general$', 'get_general_config', name='config_general'),
    url(r'^config/agenda$', 'get_agenda_config', name='config_agenda'),
    url(r'^config/application$', 'get_application_config', name='config_application'),
    url(r'^config/assignment$', 'get_assignment_config', name='config_assignment'),
    url(r'^config/system$', 'get_system_config', name='config_system'),
)
