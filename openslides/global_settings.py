# -*- coding: utf-8 -*-

import os
from openslides.utils.main import filesystem2unicode


SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'openslides.utils.auth.AnonymousAuth',)

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'

SESSION_COOKIE_NAME = 'OpenSlidesSessionID'

ugettext = lambda s: s

LANGUAGES = (
    ('de', ugettext('German')),
    ('en', ugettext('English')),
    ('fr', ugettext('French')),
    ('cs', ugettext('Czech')),
    ('pt', ugettext('Portuguese')),
)

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

LOCALE_PATHS = (
    filesystem2unicode(os.path.join(SITE_ROOT, 'locale')),
)

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/media/'

# Absolute path to the directory that holds static media from ``collectstatic``
# Example: "/home/media/static.lawrence.com/"
STATIC_ROOT = filesystem2unicode(os.path.join(SITE_ROOT, '../collected-site-static'))

# URL that handles the media served from STATIC_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://static.lawrence.com", "http://example.com/static/"
STATIC_URL = '/static/'

# Additional directories containing static files (not application specific)
# Examples: "/home/media/lawrence.com/extra-static/"
STATICFILES_DIRS = (
    filesystem2unicode(os.path.join(SITE_ROOT, 'static')),
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
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
    'openslides.config.middleware.ConfigCacheMiddleware',
)

ROOT_URLCONF = 'openslides.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or
    # "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    filesystem2unicode(os.path.join(SITE_ROOT, 'templates')),
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'mptt',
    'haystack',  # full-text-search
    'openslides.poll',
    'openslides.core',
    'openslides.account',
    'openslides.projector',
    'openslides.agenda',
    'openslides.motion',
    'openslides.assignment',
    'openslides.participant',
    'openslides.mediafile',
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

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = ['*']

# Use Haystack with Whoosh for full text search
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.whoosh_backend.WhooshEngine'
    },
}

# Haystack updates search index after each save/delete action by apps
HAYSTACK_SIGNAL_PROCESSOR = 'haystack.signals.RealtimeSignalProcessor'
