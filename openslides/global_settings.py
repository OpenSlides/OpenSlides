import os

from django.utils.translation import ugettext_lazy

from openslides.utils.plugins import collect_plugins

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

AUTH_USER_MODEL = 'users.User'

AUTHENTICATION_BACKENDS = ('openslides.users.auth.CustomizedModelBackend',)

SESSION_COOKIE_NAME = 'OpenSlidesSessionID'

LANGUAGES = (
    ('cs', ugettext_lazy('Czech')),
    ('en', ugettext_lazy('English')),
    ('fr', ugettext_lazy('French')),
    ('de', ugettext_lazy('German')),
    ('pt', ugettext_lazy('Portuguese')),
)

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

LOCALE_PATHS = (
    os.path.join(SITE_ROOT, 'locale'),
)

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/media/'

# Absolute path to the directory that holds static media from ``collectstatic``
# Example: "/home/media/static.lawrence.com/"
STATIC_ROOT = os.path.join(SITE_ROOT, '../collected-site-static')

# URL that handles the media served from STATIC_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://static.lawrence.com", "http://example.com/static/"
STATIC_URL = '/static/'

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

STATICFILES_DIRS = [
    os.path.join(SITE_ROOT, 'static')]

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'openslides.users.auth.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'openslides.core.middleware.ConfigCacheMiddleware',
)

ROOT_URLCONF = 'openslides.urls'

INSTALLED_APPS = (
    'openslides.core',
    'openslides.users',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'rest_framework',
    'openslides.poll',  # TODO: try to remove this line
    'openslides.agenda',
    'openslides.motions',
    'openslides.assignments',
    'openslides.mediafiles',
)


CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'openslidecache'
    }
}

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
HAYSTACK_SIGNAL_PROCESSOR = 'openslides.utils.haystack_processor.OpenSlidesProcessor'

# Adds all automaticly collected plugins
INSTALLED_PLUGINS = collect_plugins()

# Set this True to use tornado as single wsgi server. Set this False to use
# other webserver like Apache or Nginx as wsgi server.
USE_TORNADO_AS_WSGI_SERVER = True

OPENSLIDES_WSGI_NETWORK_LOCATION = ''


TEST_RUNNER = 'openslides.utils.test.OpenSlidesDiscoverRunner'

# Config for the REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'openslides.users.auth.RESTFrameworkAnonymousAuthentication',
    )
}
