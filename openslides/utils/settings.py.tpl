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

# The directory for user specific data files

OPENSLIDES_USER_DATA_DIR = %(openslides_user_data_dir)s


# OpenSlides plugins

# Add plugins to this list (see example entry in comment).

INSTALLED_PLUGINS += (
#    'plugin_module_name',

# Built-in plugins:
#    'tests.example_data_generator',
)

INSTALLED_APPS += INSTALLED_PLUGINS


# Important settings for production use
# https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: Keep the secret key used in production secret!

SECRET_KEY = %(secret_key)r

# Use 'DEBUG = True' to get more details for server errors.
# SECURITY WARNING: Don't run with debug turned on in production!

DEBUG = %(debug)s

# Email settings
# For SSL/TLS specific settings see https://docs.djangoproject.com/en/1.11/topics/email/#smtp-backend

EMAIL_HOST = 'localhost'
EMAIL_PORT = 587
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''

# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

# Change this setting to use e. g. PostgreSQL or MySQL.

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'mydatabase',
#         'USER': 'mydatabaseuser',
#         'PASSWORD': 'mypassword',
#         'HOST': '127.0.0.1',
#         'PORT': '5432',
#     }
# }

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(OPENSLIDES_USER_DATA_DIR, 'db.sqlite3'),
    }
}


# Set use_redis to True to activate redis as cache-, asgi- and session backend.
use_redis = False

if use_redis:
    # Django Channels

    # Unless you have only a small assembly uncomment the following lines to
    # activate Redis as backend for Django Channels and Cache. You have to install
    # a Redis server and the python packages asgi_redis and django-redis.

    # https://channels.readthedocs.io/en/latest/backends.html#redis

    CHANNEL_LAYERS['default']['BACKEND'] = 'asgi_redis.RedisChannelLayer'
    CHANNEL_LAYERS['default']['CONFIG']['prefix'] = 'asgi:'


    # Caching

    # Django uses a inmemory cache at default. This supports only one thread. If
    # you use more then one thread another caching backend is required. We recommand
    # django-redis: https://niwinz.github.io/django-redis/latest/#_user_guide

    CACHES = {
       "default": {
           "BACKEND": "django_redis.cache.RedisCache",
           "LOCATION": "redis://127.0.0.1:6379/0",
           "OPTIONS": {
               "CLIENT_CLASS": "django_redis.client.DefaultClient",
           },
           "KEY_PREFIX": "openslides-cache",
       }
    }

    # Session backend

    # Per default django uses the database as session backend. This can be slow.
    # One possibility is to use the cache session backend with redis as cache backend
    # Another possibility is to use a native redis session backend. For example:
    # https://github.com/martinrusev/django-redis-sessions

    # SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_ENGINE = 'redis_sessions.session'


# When use_redis is True, the restricted data cache caches the data individuel
# for each user. This requires a lot of memory if there are a lot of active
# users. If use_redis is False, this setting has no effect.
DISABLE_USER_CACHE = False

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

TIME_ZONE = 'Europe/Berlin'


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATICFILES_DIRS = [os.path.join(OPENSLIDES_USER_DATA_DIR, 'static')] + STATICFILES_DIRS

STATIC_ROOT = os.path.join(OPENSLIDES_USER_DATA_DIR, 'collected-static')


# Files
# https://docs.djangoproject.com/en/1.10/topics/files/

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_DIR, 'media', '')


# Password validation
# https://docs.djangoproject.com/en/1.10/topics/auth/passwords/#module-django.contrib.auth.password_validation
# AUTH_PASSWORD_VALIDATORS = []


# Customization of OpenSlides apps

MOTION_IDENTIFIER_MIN_DIGITS = 1
MOTION_IDENTIFIER_WITHOUT_BLANKS = False
MOTIONS_ALLOW_AMENDMENTS_OF_AMENDMENTS = True
