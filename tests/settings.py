"""
Settings file for OpenSlides' tests
"""

import os
from openslides.global_settings import *  # noqa

# Path to the directory for user specific data files

OPENSLIDES_USER_DATA_PATH = os.path.realpath(os.path.dirname(__file__))


# SECURITY WARNING: Keep the secret key used in production secret!

SECRET_KEY = 'secret'


# Use 'DEBUG = True' to get more details for server errors.
# SECURITY WARNING: Don't run with debug turned on in production!

DEBUG = True
TEMPLATE_DEBUG = DEBUG


# OpenSlides plugins
# Add plugins to this list.

INSTALLED_PLUGINS += (
    'tests.utils',
)

INSTALLED_APPS += INSTALLED_PLUGINS


# Database
# Change this to use MySQL or PostgreSQL.
# See https://docs.djangoproject.com/en/1.7/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ''
    }
}


# Some other settings

TIME_ZONE = 'Europe/Berlin'

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, '')

TEMPLATE_DIRS = (
    os.path.join(OPENSLIDES_USER_DATA_PATH, 'templates'),
)

STATICFILES_DIRS.insert(0, os.path.join(OPENSLIDES_USER_DATA_PATH, 'static'))

HAYSTACK_CONNECTIONS['default']['STORAGE'] = 'ram'


# Special test settings
# Use a faster password hasher.

PASSWORD_HASHERS = (
    'django.contrib.auth.hashers.MD5PasswordHasher',
)
