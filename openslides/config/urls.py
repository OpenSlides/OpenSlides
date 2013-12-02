# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from openslides.utils.views import RedirectView

from .signals import config_signal
from .views import ConfigView

urlpatterns = patterns(
    '',
    url(r'^$',
        RedirectView.as_view(url_name='config_general'),
        name='config_first_config_collection_view')
)

for receiver, config_collection in config_signal.send(sender='config_urls'):
    if config_collection.is_shown():
        urlpatterns += patterns('', url(r'^%s/$' % config_collection.url,
                                ConfigView.as_view(config_collection=config_collection),
                                name='config_%s' % config_collection.url))
