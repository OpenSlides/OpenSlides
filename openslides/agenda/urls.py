from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^print/$',
        views.AgendaPDF.as_view(),
        name='agenda_pdf'),
]
