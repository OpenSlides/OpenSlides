# -*- coding: utf-8 -*-
#
# Settings file for OpenSlides
#

%(import_function)s
from openslides.global_settings import *

# Use 'DEBUG = True' to get more details for server errors. Default for releases: False
DEBUG = %(debug)s
TEMPLATE_DEBUG = DEBUG

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': %(database_path_value)s,
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }
}

# Set timezone
TIME_ZONE = 'Europe/Berlin'

# Make this unique, and don't share it with anybody.
SECRET_KEY = %(secret_key)r

# Add OpenSlides plugins to this list (see example entry in comment)
INSTALLED_PLUGINS = (
#    'pluginname',
)

INSTALLED_APPS += INSTALLED_PLUGINS

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = %(media_path_value)s

# Path to Whoosh search index
HAYSTACK_CONNECTIONS['default']['PATH'] = %(whoosh_index_path_value)s
