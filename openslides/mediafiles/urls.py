from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^pdf/next/$',
        views.PdfNextView.as_view(),
        name='mediafiles_next_pdf_page'),
    url(r'^pdf/prev/$',
        views.PdfPreviousView.as_view(),
        name='mediafiles_prev_pdf_page'),
    url(r'^pdf/target_page/$',
        views.PdfGoToPageView.as_view(),
        name='mediafiles_target_pdf_page'),
    url(r'^pdf/toggle_fullscreen/$',
        views.PdfToggleFullscreenView.as_view(),
        name='mediafiles_toggle_fullscreen')
)
