from django.conf.urls import include, url

from openslides.utils.plugins import get_all_plugin_urlpatterns


urlpatterns = get_all_plugin_urlpatterns()

urlpatterns += [
    url(r"^core/", include("openslides.core.urls")),
    url(r"^users/", include("openslides.users.urls")),
]
