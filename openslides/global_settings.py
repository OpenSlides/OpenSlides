#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.openslides_settings
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    OpenSlides default settings.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os
import sys

from openslides.main import fs2unicode

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'openslides.utils.auth.AnonymousAuth',)

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'

SESSION_COOKIE_NAME = 'OpenSlidesSessionID'

ugettext = lambda s: s

MOTION_WORKFLOW = (
    ('default', ugettext('default'), 'openslides.motion.workflow.default_workflow'),
)

LANGUAGES = (
    ('de', ugettext('German')),
    ('en', ugettext('English')),
    ('fr', ugettext('French')),
)


# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

LOCALE_PATHS = (
    fs2unicode(os.path.join(SITE_ROOT, 'locale')),
)

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = fs2unicode(os.path.join(SITE_ROOT, './static/'))

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory that holds static media from ``collectstatic``
# Example: "/home/media/static.lawrence.com/"
STATIC_ROOT = fs2unicode(os.path.join(SITE_ROOT, '../site-static'))

# URL that handles the media served from STATIC_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://static.lawrence.com", "http://example.com/static/"
STATIC_URL = '/static/'

# Additional directories containing static files (not application specific)
# Examples: "/home/media/lawrence.com/extra-static/"
STATICFILES_DIRS = (
    fs2unicode(os.path.join(SITE_ROOT, 'static')),
)

#XXX: Note this setting (as well as our workaround finder)
#     can be removed again once django-bug-#18404 has been resolved
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'openslides.utils.staticfiles.AppDirectoriesFinder',
)

MESSAGE_STORAGE = 'django.contrib.messages.storage.cookie.CookieStorage'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'openslides.participant.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

ROOT_URLCONF = 'openslides.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or
    # "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    fs2unicode(os.path.join(SITE_ROOT, 'templates')),
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'mptt',
    'openslides.utils',
    'openslides.poll',
    'openslides.projector',
    'openslides.agenda',
    'openslides.motion',
    'openslides.assignment',
    'openslides.participant',
    'openslides.config',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.contrib.messages.context_processors.messages',
    'django.core.context_processors.request',
    'django.core.context_processors.i18n',
    'django.core.context_processors.static',
    'openslides.utils.auth.anonymous_context_additions',
)

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'openslidecache'
    }
}

TEST_RUNNER = 'discover_runner.DiscoverRunner'
TEST_DISCOVER_TOP_LEVEL = os.path.dirname(os.path.dirname(__file__))
