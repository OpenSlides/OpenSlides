from django.conf.urls import url
from django.views.decorators.csrf import csrf_exempt

from . import views


urlpatterns = [
    # Auth
    url(r"^login/$", views.UserLoginView.as_view(), name="user_login"),
    url(r"^logout/$", views.UserLogoutView.as_view(), name="user_logout"),
    url(r"^whoami/$", views.WhoAmIView.as_view(), name="user_whoami"),
    url(r"^setpassword/$", views.SetPasswordView.as_view(), name="user_setpassword"),
    url(r"^setpresence/$", views.SetPresenceView.as_view(), name="user_setpresence"),
    url(r"^setpresence-no-autoupdate/$", views.SetPresenceNoAutoupdateView.as_view(), name="user_setpresence_no_autoupdate"),
    url(r"^setpresence-only-autoupdate/$", views.SetPresenceOnlyAutoupdateView.as_view(), name="user_setpresence_only_autoupdate"),
    url(r"^simple-autoupdate/$", views.SimpleAutoupdate.as_view(), name="user_simple_autoupdate"),
    url(r"^echo/$", csrf_exempt(views.Echo.as_view()), name="user_echo"),
    url(r"^echo-login/$", views.EchoLogin.as_view(), name="user_echo_login"),
    url(r"^get-config/$", views.GetConfig.as_view(), name="user_get_config"),
    url(r"^get-config-login/$", views.GetConfigLogin.as_view(), name="user_get_config_login"),
    url(r"^current-autoupdate/$", csrf_exempt(views.CurrentAutoupdate.as_view()), name="user_current_autoupdate"),
    url(r"^current-autoupdate-login/$", views.CurrentAutoupdateLogin.as_view(), name="user_current_autoupdate_login"),
    url(
        r"^reset-password/$",
        views.PasswordResetView.as_view(),
        name="user_reset_password",
    ),
    url(
        r"^reset-password-confirm/$",
        views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
]
