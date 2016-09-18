"""
Settings file for OpenSlides.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

import os
from openslides.global_settings import *
%(import_function)s

# Path to the directory for user specific data files

OPENSLIDES_USER_DATA_PATH = %(openslides_user_data_path)s


# OpenSlides plugins

# Add plugins to this list (see example entry in comment).

INSTALLED_PLUGINS += (
#    'plugin_module_name',
)

INSTALLED_APPS += INSTALLED_PLUGINS


# Important settings for production use
# https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: Keep the secret key used in production secret!

SECRET_KEY = %(secret_key)r

# Use 'DEBUG = True' to get more details for server errors.
# SECURITY WARNING: Don't run with debug turned on in production!

DEBUG = %(debug)s


# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

# Change this setting to use e. g. PostgreSQL or MySQL.

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(OPENSLIDES_USER_DATA_PATH, 'db.sqlite3'),
    }
}


# Django Channels

# Unless you have only a small assembly uncomment the following lines to
# activate Redis as backend for Django Channels and Cache. You have to install
# a Redis server and the python packages asgi_redis and django-redis.

# https://channels.readthedocs.io/en/latest/backends.html#redis

# CHANNEL_LAYERS['default']['BACKEND'] = 'asgi_redis.RedisChannelLayer'

# https://niwinz.github.io/django-redis/latest/#_user_guide

# CACHES = {
#     "default": {
#         "BACKEND": "django_redis.cache.RedisCache",
#         "LOCATION": "redis://127.0.0.1:6379/0",
#         "OPTIONS": {
#             "CLIENT_CLASS": "django_redis.client.DefaultClient",
#         }
#     }
# }


# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

TIME_ZONE = 'Europe/Berlin'


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATICFILES_DIRS = [os.path.join(OPENSLIDES_USER_DATA_PATH, 'static')] + STATICFILES_DIRS


# Files
# https://docs.djangoproject.com/en/1.10/topics/files/

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, 'media', '')


# Whoosh search library
# https://whoosh.readthedocs.io/en/latest/

SEARCH_INDEX = os.path.join(OPENSLIDES_USER_DATA_PATH, 'search_index')
