from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^pdf/$',
        views.MotionPDFView.as_view(print_all_motions=True),
        name='motions_pdf'),

    url(r'^(?P<pk>\d+)/pdf/$',
        views.MotionPDFView.as_view(print_all_motions=False),
        name='motions_single_pdf'),
)
