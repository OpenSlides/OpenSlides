from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',

    # PDF
    url(r'^print/$',
        views.AgendaPDF.as_view(),
        name='agenda_pdf'),

    # TODO: remove it after implement projector rest api
    url(r'^list_of_speakers/projector/$',
        views.CurrentListOfSpeakersProjectorView.as_view(),
        name='agenda_current_list_of_speakers_projector'),
)
