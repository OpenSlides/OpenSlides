from django.conf.urls import url

from . import views


urlpatterns = [
    url(r"^servertime/$", views.ServerTime.as_view(), name="core_servertime"),
    url(r"^version/$", views.VersionView.as_view(), name="core_version"),
    url(
        r"^history/information/$",
        views.HistoryInformationView.as_view(),
        name="core_history_information",
    ),
    url(r"^history/data/$", views.HistoryDataView.as_view(), name="core_history_data"),
]
