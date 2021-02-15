"""
Settings file for OpenSlides.

For more information on this file, see
https://github.com/OpenSlides/OpenSlides/blob/master/SETTINGS.rst
"""

import os
from openslides.global_settings import *


# OpenSlides plugins
# Add plugins to this list (see example entry in comment).

INSTALLED_PLUGINS += (
#    'plugin_module_name',
)
INSTALLED_APPS += INSTALLED_PLUGINS


# SECURITY WARNING: Keep the secret key used in production secret!
SECRET_KEY = %(secret_key)r

# Use 'DEBUG = True' to get more details for server errors.
# SECURITY WARNING: Don't run with debug turned on in production!

DEBUG = %(debug)s

# Controls the verbosity on errors during a reset password. If enabled, an error
# will be shown, if there does not exist a user with a given email address. So one
# can check, if a email is registered. If this is not wanted, disable verbose
# messages. An success message will always be shown.

RESET_PASSWORD_VERBOSE_ERRORS = True

# Email settings
# For an explaination and more settings values see https://docs.djangoproject.com/en/2.2/topics/email/#smtp-backend

EMAIL_HOST = 'localhost'
EMAIL_PORT = 587
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''
EMAIL_USE_SSL = False
EMAIL_USE_TLS = False
EMAIL_TIMEOUT = None
DEFAULT_FROM_EMAIL = 'noreply@example.com'

# Increasing Upload size to 100mb (default is 2.5mb)
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600

# Database
# https://docs.djangoproject.com/en/2.2/ref/settings/#databases

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


# Collection Cache
REDIS_ADDRESS = "redis://redis:6379/0"


# SAML integration
# Please read https://github.com/OpenSlides/OpenSlides/blob/master/openslides/saml/README.md
# for additional requirements.

ENABLE_SAML = False
if ENABLE_SAML:
    INSTALLED_APPS += ['openslides.saml']


# Controls if electronic voting (means non-analog polls) are enabled.
ENABLE_ELECTRONIC_VOTING = False

# Controls if chat should be enabled
ENABLE_CHAT = False

# Jitsi integration
# JITSI_DOMAIN = None
# JITSI_ROOM_NAME = None
# JITSI_ROOM_PASSWORD = None


# Internationalization
# https://docs.djangoproject.com/en/2.2/topics/i18n/
TIME_ZONE = 'Europe/Berlin'


# Password validation
# https://docs.djangoproject.com/en/2.2/topics/auth/passwords/#module-django.contrib.auth.password_validation
# AUTH_PASSWORD_VALIDATORS = []


# Logging
# see https://docs.djangoproject.com/en/2.2/topics/logging/
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'gunicorn': {
            'format': '{asctime} [{process:d}] [{levelname}] {name} {message}',
            'style': '{',
            'datefmt': '[%%Y-%%m-%%d %%H:%%M:%%S %%z]',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'gunicorn',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
        },
        'openslides': {
            'handlers': ['console'],
            'level': os.getenv('OPENSLIDES_LOG_LEVEL', 'INFO'),
        }
    },
}

SETTINGS_FILEPATH = __file__
