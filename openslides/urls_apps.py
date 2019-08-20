from django.conf.urls import include, url

from openslides.saml import SAML_ENABLED
from openslides.utils.plugins import get_all_plugin_urlpatterns


urlpatterns = get_all_plugin_urlpatterns()

urlpatterns += [
    url(r"^core/", include("openslides.core.urls")),
    url(r"^users/", include("openslides.users.urls")),
]

if SAML_ENABLED:
    urlpatterns += [url(r"^saml/", include("openslides.saml.urls"))]
