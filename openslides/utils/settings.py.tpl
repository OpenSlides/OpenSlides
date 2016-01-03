"""
Settings file for OpenSlides

For more information on this file, see
https://docs.djangoproject.com/en/1.7/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.7/ref/settings/
"""

import os
from openslides.global_settings import *
%(import_function)s

# Path to the directory for user specific data files

OPENSLIDES_USER_DATA_PATH = %(openslides_user_data_path)s


# SECURITY WARNING: Keep the secret key used in production secret!

SECRET_KEY = %(secret_key)r


# Use 'DEBUG = True' to get more details for server errors.
# SECURITY WARNING: Don't run with debug turned on in production!

DEBUG = %(debug)s
TEMPLATE_DEBUG = DEBUG


# OpenSlides plugins
# Add plugins to this list (see example entry in comment).

INSTALLED_PLUGINS += (
#    'pluginname',
)

INSTALLED_APPS += INSTALLED_PLUGINS


# Database
# Change this to use MySQL or PostgreSQL.
# See https://docs.djangoproject.com/en/1.7/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(OPENSLIDES_USER_DATA_PATH, 'database.sqlite')
    }
}


# Some other settings

TIME_ZONE = 'Europe/Berlin'

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, 'media', '')

TEMPLATE_DIRS = (
    os.path.join(OPENSLIDES_USER_DATA_PATH, 'templates'),
)

STATICFILES_DIRS = [os.path.join(OPENSLIDES_USER_DATA_PATH, 'static')] + STATICFILES_DIRS


SEARCH_INDEX = os.path.join(OPENSLIDES_USER_DATA_PATH, 'search_index')
