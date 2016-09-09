"""
Settings file for OpenSlides' tests
"""

import os

from openslides.global_settings import *  # noqa

# Path to the directory for user specific data files
OPENSLIDES_USER_DATA_PATH = os.path.realpath(os.path.dirname(__file__))


# SECURITY WARNING: Keep the secret key used in production secret!
SECRET_KEY = 'secret'

# OpenSlides plugins
# Add plugins to this list.

INSTALLED_PLUGINS += (  # noqa
    'tests.integration.test_plugin',
)

INSTALLED_APPS += INSTALLED_PLUGINS  # noqa


# Database
# Change this to use MySQL or PostgreSQL.
# See https://docs.djangoproject.com/en/1.7/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
    }
}


# Some other settings

TIME_ZONE = 'Europe/Berlin'

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, '')

STATICFILES_DIRS.insert(0, os.path.join(OPENSLIDES_USER_DATA_PATH, 'static'))  # noqa

SEARCH_INDEX = 'ram'


# Special test settings
# Use a faster password hasher.

PASSWORD_HASHERS = (
    'django.contrib.auth.hashers.MD5PasswordHasher',
)

# Use the dummy cache that does not cache anything
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache'
    },
    'locmem': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'
    }
}
