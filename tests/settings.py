"""
Settings file for OpenSlides' tests.
"""

import os

from openslides.global_settings import *  # noqa


# Path to the directory for user specific data files

OPENSLIDES_USER_DATA_PATH = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# OpenSlides plugins

# Add plugins to this list.

INSTALLED_PLUGINS += ("tests.integration.test_plugin",)  # noqa

INSTALLED_APPS += INSTALLED_PLUGINS  # noqa


# Important settings for production use
# https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

SECRET_KEY = "secret"

DEBUG = False

# Uncomment to test with the redis cache
# REDIS_ADDRESS = "redis://127.0.0.1"


# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

# Change this setting to use e. g. PostgreSQL or MySQL.

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "TEST": {"NAME": os.path.join(OPENSLIDES_USER_DATA_PATH, "db.sqlite3.test")},
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

TIME_ZONE = "Europe/Berlin"


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATICFILES_DIRS.insert(0, os.path.join(OPENSLIDES_USER_DATA_PATH, "static"))  # noqa


# Files
# https://docs.djangoproject.com/en/1.10/topics/files/

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, "")


# Special settings only for testing

# Use a faster password hasher.

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Deactivate restricted_data_cache
RESTRICTED_DATA_CACHE = False

REST_FRAMEWORK = {"TEST_REQUEST_DEFAULT_FORMAT": "json"}

ENABLE_ELECTRONIC_VOTING = True
