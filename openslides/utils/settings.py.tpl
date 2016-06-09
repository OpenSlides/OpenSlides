"""
Settings file for OpenSlides

For more information on this file, see
https://docs.djangoproject.com/en/1.9/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.9/ref/settings/
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


# OpenSlides plugins
# Add plugins to this list (see example entry in comment).

INSTALLED_PLUGINS += (
#    'plugin_module_name',
)

INSTALLED_APPS += INSTALLED_PLUGINS


# Database
# Change this to use MySQL or PostgreSQL.
# See https://docs.djangoproject.com/en/1.9/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(OPENSLIDES_USER_DATA_PATH, 'database.sqlite')
    }
}


# Big Mode
# Uncomment the following lines to activate redis as channel and cache backend.
# You have to install a redis server and the python packages asgi_redis and
# django-redis for this to work.
# See https://channels.readthedocs.io/en/latest/backends.html#redis
#     https://niwinz.github.io/django-redis/latest/#_user_guide

# CHANNEL_LAYERS['default']['BACKEND'] = 'asgi_redis.RedisChannelLayer'
# CACHES = {
#     "default": {
#         "BACKEND": "django_redis.cache.RedisCache",
#         "LOCATION": "redis://127.0.0.1:6379/1",
#         "OPTIONS": {
#             "CLIENT_CLASS": "django_redis.client.DefaultClient",
#         }
#     }
# }


# Some other settings

TIME_ZONE = 'Europe/Berlin'

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, 'media', '')

TEMPLATE_DIRS = (
    os.path.join(OPENSLIDES_USER_DATA_PATH, 'templates'),
)

STATICFILES_DIRS = [os.path.join(OPENSLIDES_USER_DATA_PATH, 'static')] + STATICFILES_DIRS

SEARCH_INDEX = os.path.join(OPENSLIDES_USER_DATA_PATH, 'search_index')
