from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',

    # PDF
    url(r'^print/$',
        views.AssignmentPDF.as_view(),
        name='assignments_pdf'),

    url(r'^(?P<pk>\d+)/print/$',
        views.AssignmentPDF.as_view(),
        name='assignments_single_pdf'),

    url(r'^poll/(?P<poll_pk>\d+)/print/$',
        views.AssignmentPollPDF.as_view(),
        name='assignmentpoll_pdf'),
)
