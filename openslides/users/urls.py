from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^csv_import/$',
        views.UserCSVImportView.as_view(),
        name='user_csv_import'),

    # PDF
    url(r'^print/$',
        views.UsersListPDF.as_view(),
        name='user_print'),

    url(r'^passwords/print/$',
        views.UsersPasswordsPDF.as_view(),
        name='print_passwords'),

    # auth
    url(r'^login/$',
        views.UserLoginView.as_view(),
        name='user_login'),

    url(r'^logout/$',
        views.UserLogoutView.as_view(),
        name='user_logout'),

    url(r'^whoami/$',
        views.WhoAmIView.as_view(),
        name='user_whoami'),
)
