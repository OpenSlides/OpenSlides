"""
Settings file for OpenSlides' tests.
"""

import os

from openslides.global_settings import *  # noqa


# Path to the directory for user specific data files

OPENSLIDES_USER_DATA_PATH = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# OpenSlides plugins

# Add plugins to this list.

INSTALLED_PLUGINS += (  # noqa
    'tests.integration.test_plugin',
)

INSTALLED_APPS += INSTALLED_PLUGINS  # noqa


# Important settings for production use
# https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

SECRET_KEY = 'secret'

DEBUG = False


# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

# Change this setting to use e. g. PostgreSQL or MySQL.

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
    }
}

# Configure session in the cache

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"

# When use_redis is True, the restricted data cache caches the data individuel
# for each user. This requires a lot of memory if there are a lot of active
# users. If use_redis is False, this setting has no effect.
DISABLE_USER_CACHE = False

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

TIME_ZONE = 'Europe/Berlin'


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATICFILES_DIRS.insert(0, os.path.join(OPENSLIDES_USER_DATA_PATH, 'static'))  # noqa


# Files
# https://docs.djangoproject.com/en/1.10/topics/files/

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, '')


# Customization of OpenSlides apps

MOTION_IDENTIFIER_MIN_DIGITS = 1


# Special settings only for testing

# Use a faster password hasher.

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# At least in Django 2.1 and Channels 2.1 the django transactions can not be shared between
# threads. So we have to skip the asyncio-cache.
SKIP_CACHE = True
