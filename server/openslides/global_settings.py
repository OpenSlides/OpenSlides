import os

from openslides.utils.plugins import collect_plugins


MODULE_DIR = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))


# Application definition

INSTALLED_APPS = [
    "openslides.core",
    "openslides.users",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "rest_framework",
    "channels",
    "openslides.agenda",
    "openslides.topics",
    "openslides.motions",
    "openslides.assignments",
    "openslides.mediafiles",
]

INSTALLED_PLUGINS = collect_plugins()  # Adds all automaticly collected plugins

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "openslides.utils.autoupdate.AutoupdateBundleMiddleware",
]

ROOT_URLCONF = "openslides.urls"

ALLOWED_HOSTS = ["*"]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
    }
]

# Email
# https://docs.djangoproject.com/en/1.10/topics/email/

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_TIMEOUT = (
    5  # Timeout in seconds for blocking operations like the connection attempt
)

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = "en"

LANGUAGES = (
    ("en", "English"),
    ("de", "Deutsch"),
    ("fr", "Français"),
    ("es", "Español"),
    ("pt", "Português"),
    ("cs", "Český"),
    ("ru", "русский"),
)

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True

LOCALE_PATHS = [os.path.join(MODULE_DIR, "locale")]


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATIC_URL = "/static/"

STATICFILES_DIRS = [os.path.join(MODULE_DIR, "static")]


# Sessions and user authentication
# https://docs.djangoproject.com/en/1.10/topics/http/sessions/
# https://docs.djangoproject.com/en/1.10/topics/auth/

AUTH_USER_MODEL = "users.User"

AUTH_GROUP_MODEL = "users.Group"

SESSION_COOKIE_NAME = "OpenSlidesSessionID"

SESSION_EXPIRE_AT_BROWSER_CLOSE = True

CSRF_COOKIE_NAME = "OpenSlidesCsrfToken"

CSRF_COOKIE_AGE = None

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    "django.contrib.auth.hashers.BCryptPasswordHasher",
]


# Files
# https://docs.djangoproject.com/en/1.10/topics/files/

MEDIA_URL = "/media/"


# Django Channels
# http://channels.readthedocs.io/en/latest/

ASGI_APPLICATION = "openslides.routing.application"

CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}


# Enable updating the last_login field for users on every login.
ENABLE_LAST_LOGIN_FIELD = False
