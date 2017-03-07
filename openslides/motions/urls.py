from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^docxtemplate/$',
        views.MotionDocxTemplateView.as_view(),
        name='motions_docx_template'),
]
