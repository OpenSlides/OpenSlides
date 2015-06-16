from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^print/$',
        views.AgendaPDF.as_view(),
        name='agenda_pdf'),
)
