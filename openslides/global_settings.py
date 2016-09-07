import os

from openslides.utils.plugins import collect_plugins

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

AUTH_USER_MODEL = 'users.User'

AUTHENTICATION_BACKENDS = ('openslides.users.auth.CustomizedModelBackend',)

# Uses a db session backend, that saves the user_id directly in the db
SESSION_ENGINE = 'openslides.core.session_backend'

SESSION_COOKIE_NAME = 'OpenSlidesSessionID'

LANGUAGES = (
    ('en', 'English'),
    ('de', 'Deutsch'),
    ('fr', 'Français'),
    ('es', 'Español'),
    ('pt', 'Português'),
    ('cs', 'Český'),
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
    'channels',
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

# Adds all automaticly collected plugins
INSTALLED_PLUGINS = collect_plugins()

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.BCryptPasswordHasher',
    'django.contrib.auth.hashers.MD5PasswordHasher',  # MD5 is only used for inital passwords.
]

TEST_RUNNER = 'openslides.utils.test.OpenSlidesDiscoverRunner'

# Config for the REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'openslides.users.auth.RESTFrameworkAnonymousAuthentication',
    )
}

# Config for channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'asgiref.inmemory.ChannelLayer',
        'ROUTING': 'openslides.routing.channel_routing',
    },
}
