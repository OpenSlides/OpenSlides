from django.conf.urls import url
from django.views.decorators.csrf import csrf_exempt

from . import views


urlpatterns = [
    url(r"^$", csrf_exempt(views.SamlView.as_view())),
    url(r"^metadata/$", views.serve_metadata),
]
