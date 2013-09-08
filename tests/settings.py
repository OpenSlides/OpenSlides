#!/usr/bin/env python
# -*- coding: utf-8 -*-

from openslides.global_settings import *  # noqa

# Use 'DEBUG = True' to get more details for server errors
# (Default for releases: 'False')
DEBUG = True
TEMPLATE_DEBUG = DEBUG

DBPATH = ''

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DBPATH,
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }
}

# Set timezone
TIME_ZONE = 'Europe/Berlin'

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'secred'

# Add OpenSlides plugins to this list (see example entry in comment)
INSTALLED_PLUGINS = (
    'tests.person_api',
)

INSTALLED_APPS += INSTALLED_PLUGINS

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = ''

# Use RAM storage for whoosh index
HAYSTACK_CONNECTIONS['default']['STORAGE'] = 'ram'
