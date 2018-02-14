from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^docxtemplate/$',
        views.AgendaDocxTemplateView.as_view(),
        name='agenda_docx_template'),
]
