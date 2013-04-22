#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    Url patterns for the config app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import patterns, url

from openslides.utils.views import RedirectView
from .signals import config_signal
from .views import ConfigView


urlpatterns = patterns('',
    url(r'^$',
        RedirectView.as_view(url_name='config_general'),
        name='config_first_config_page',
    ),
)

for receiver, config_page in config_signal.send(sender='config_urls'):
    if config_page.is_shown():
        urlpatterns += patterns('', url(r'^%s/$' % config_page.url,
                                ConfigView.as_view(config_page=config_page),
                                name='config_%s' % config_page.url))
