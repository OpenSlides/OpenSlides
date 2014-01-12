# -*- coding: utf-8 -*-
#
# Settings file for OpenSlides
#

import os
from openslides.global_settings import *
%(import_function)s
# Path to the directory for user specific data files
OPENSLIDES_USER_DATA_PATH = %(openslides_user_data_path)s

# Use 'DEBUG = True' to get more details for server errors. Default for releases: False
DEBUG = %(debug)s
TEMPLATE_DEBUG = DEBUG

# Make this unique, and don't share it with anybody.
SECRET_KEY = %(secret_key)r

# Database settings. Change this to use MySQL or PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(OPENSLIDES_USER_DATA_PATH, 'database.sqlite'),
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': ''}}

# Add OpenSlides plugins to this list (see example entry in comment)
INSTALLED_PLUGINS += (
#    'pluginname',
)

INSTALLED_APPS += INSTALLED_PLUGINS

# Some other settings
TIME_ZONE = 'Europe/Berlin'

MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_PATH, 'media', '')

HAYSTACK_CONNECTIONS['default']['PATH'] = os.path.join(OPENSLIDES_USER_DATA_PATH, 'whoosh_index', '')

TEMPLATE_DIRS = (
    os.path.join(OPENSLIDES_USER_DATA_PATH, 'templates'),
    filesystem2unicode(os.path.join(SITE_ROOT, 'templates')))

STATICFILES_DIRS = (
    os.path.join(OPENSLIDES_USER_DATA_PATH, 'static'),
    filesystem2unicode(os.path.join(SITE_ROOT, 'static')))
