# -*- coding: utf-8 -*-
#
# Settings file for OpenSlides' tests
#

import os
from openslides.global_settings import *  # noqa

# Path to the directory for user specific data files
OPENSLIDES_USER_DATA_PATH = os.path.realpath(os.path.dirname(__file__))

# Use 'DEBUG = True' to get more details for server errors. Default for releases: False
DEBUG = True
TEMPLATE_DEBUG = DEBUG

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'secred'

# Database settings. Change this to use MySQL or PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '',
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': ''}}

# Add OpenSlides plugins to this list
INSTALLED_PLUGINS = (
    'tests.person_api',
    'tests.projector',
    'tests.utils',
)

INSTALLED_APPS += INSTALLED_PLUGINS

# Some other settings
TIME_ZONE = 'Europe/Berlin'

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, '')

HAYSTACK_CONNECTIONS['default']['STORAGE'] = 'ram'

TEMPLATE_DIRS = (
    os.path.join(OPENSLIDES_USER_DATA_PATH, 'templates'),
    filesystem2unicode(os.path.join(SITE_ROOT, 'templates')))

STATICFILES_DIRS = (
    os.path.join(OPENSLIDES_USER_DATA_PATH, 'static'),
    filesystem2unicode(os.path.join(SITE_ROOT, 'static')))

# Use a faster passwort hasher
PASSWORD_HASHERS = (
    'django.contrib.auth.hashers.MD5PasswordHasher',
)
