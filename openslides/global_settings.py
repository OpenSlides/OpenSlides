import os
import copy

from django.utils.translation import ugettext_lazy

from openslides.utils.plugins import collect_plugins

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

AUTH_USER_MODEL = 'users.User'

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'

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
    'openslides.users.auth.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'openslides.config.middleware.ConfigCacheMiddleware',
)

ROOT_URLCONF = 'openslides.urls'

INSTALLED_APPS = (
    'openslides.core',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'mptt',
    'haystack',  # full-text-search
    'ckeditor',
    'rest_framework',
    'openslides.poll',
    'openslides.account',
    'openslides.projector',
    'openslides.agenda',
    'openslides.motion',
    'openslides.assignment',
    'openslides.users',
    'openslides.mediafile',
    'openslides.config',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'openslides.users.auth.auth',
    'django.contrib.messages.context_processors.messages',
    'django.core.context_processors.request',
    'django.core.context_processors.i18n',
    'django.core.context_processors.static',
    'openslides.utils.main_menu.main_menu_entries',
    'openslides.core.chatbox.chat_messages_context_processor',
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

# CKeditor settings
CKEDITOR_DEFAULT_CONFIG = {'toolbar': 'Full',
                           'bodyClass': 'ckeditor_html',
                           'allowedContent':
                               'h1 h2 h3 pre b i u strike em; '

                               # A workaround for the problem described in http://dev.ckeditor.com/ticket/10192
                               # Hopefully, the problem will be solved in the final version of CKEditor 4.1
                               # If so, then {margin-left} can be removed
                               'p{margin-left}; '

                               'a[!href]; '
                               'ol ul{list-style}; '
                               'li; '
                               'pre; '
                               'span{color,background-color}; ',
                           'removePlugins': 'save, print, preview, pagebreak, templates, showblocks, magicline',
                           'extraPlugins': 'insertpre',  # see http://ckeditor.com/addon/insertpre
                           'toolbar_Full': [
                               {'name': 'document',    'items': ['Source', '-', 'Save', 'DocProps', 'Preview', 'Print', '-', 'Templates']},
                               {'name': 'clipboard',   'items': ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo']},
                               {'name': 'editing',     'items': ['Find', 'Replace', '-', 'SpellChecker', 'Scayt']},
                               {'name': 'basicstyles', 'items': ['Bold', 'Italic', 'Underline', 'Strike', '-', 'RemoveFormat']},
                               {'name': 'paragraph',   'items': ['NumberedList', 'BulletedList', '-', 'InsertPre']},
                               {'name': 'links',       'items': ['Link', 'Unlink']},
                               {'name': 'styles',      'items': ['Format', 'TextColor', 'BGColor']},
                               {'name': 'tools',       'items': ['Maximize', 'ShowBlocks', '-', 'About']}
                           ]}
CKEDITOR_IMG_CONFIG = copy.deepcopy(CKEDITOR_DEFAULT_CONFIG)
CKEDITOR_IMG_CONFIG['allowedContent'] += 'img; '
CKEDITOR_IMG_CONFIG['toolbar_Full'].append({'name': 'images', 'items': ['Image']})

CKEDITOR_UPLOAD_PATH = 'ckeditor'
CKEDITOR_CONFIGS = {
    'default': CKEDITOR_DEFAULT_CONFIG,
    'images': CKEDITOR_IMG_CONFIG,
}


# Set this True to use tornado as single wsgi server. Set this False to use
# other webserver like Apache or Nginx as wsgi server.
USE_TORNADO_AS_WSGI_SERVER = True

OPENSLIDES_WSGI_NETWORK_LOCATION = ''


TEST_RUNNER = 'openslides.utils.test.OpenSlidesDiscoverRunner'

# Config for the REST Framework
REST_FRAMEWORK = {
    'UNAUTHENTICATED_USER': 'openslides.users.auth.AnonymousUser',
}
