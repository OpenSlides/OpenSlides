import os

from openslides.utils.plugins import collect_plugins


MODULE_DIR = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))

# This is not set to the docker environment
OPENSLIDES_USER_DATA_DIR = "/app/personal_data/var"

# Application definition

INSTALLED_APPS = [
    "openslides.core",
    "openslides.users",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "rest_framework",
    "openslides.agenda",
    "openslides.topics",
    "openslides.motions",
    "openslides.assignments",
    "openslides.mediafiles",
    "openslides.chat",
]

INSTALLED_PLUGINS = collect_plugins()  # Adds all automatically collected plugins

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "openslides.utils.autoupdate_bundle.AutoupdateBundleMiddleware",
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

SESSION_ENGINE = "openslides.utils.sessions"

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

STATIC_URL = "/static/"

STATICFILES_DIRS = [os.path.join(MODULE_DIR, "static")] + [
    os.path.join(OPENSLIDES_USER_DATA_DIR, "static")
]

# Static files (CSS, JavaScript, Images)
STATIC_ROOT = os.path.join(OPENSLIDES_USER_DATA_DIR, "collected-static")

# Files
# https://docs.djangoproject.com/en/2.2/topics/files/
MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_DIR, "media", "")

MEDIA_URL = "/media/"

# Sessions and user authentication
# https://docs.djangoproject.com/en/2.2/topics/http/sessions/
# https://docs.djangoproject.com/en/2.2/topics/auth/

AUTH_USER_MODEL = "users.User"

AUTH_GROUP_MODEL = "users.Group"

AUTHENTICATION_BACKENDS = ["openslides.utils.auth_backend.ModelBackend"]

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

# Enable updating the last_login field for users on every login.
ENABLE_LAST_LOGIN_FIELD = False
