"""
Settings file for OpenSlides' tests.
"""

import os

from openslides.global_settings import *  # noqa

# Path to the directory for user specific data files

OPENSLIDES_USER_DATA_PATH = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))


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


# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

TIME_ZONE = 'Europe/Berlin'


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATICFILES_DIRS.insert(0, os.path.join(OPENSLIDES_USER_DATA_PATH, 'static'))  # noqa


# Files
# https://docs.djangoproject.com/en/1.10/topics/files/

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, '')


# Whoosh search library
# https://whoosh.readthedocs.io/en/latest/

SEARCH_INDEX = 'ram'


# Special settings only for testing

TEST_RUNNER = 'openslides.utils.test.OpenSlidesDiscoverRunner'

# Use a faster password hasher.

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]


# Use the dummy cache that does not cache anything
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache'
    },
    'locmem': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'
    }
}
