from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^pdf/$',
        views.MotionPDFView.as_view(print_all_motions=True),
        name='motions_pdf'),

    url(r'^(?P<pk>\d+)/pdf/$',
        views.MotionPDFView.as_view(print_all_motions=False),
        name='motions_single_pdf'),

    url(r'^poll/(?P<poll_pk>\d+)/print/$',
        views.MotionPollPDF.as_view(),
        name='motionpoll_pdf'),
]
