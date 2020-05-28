"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

from django.core.wsgi import get_wsgi_application

from .utils.main import setup_django_settings_module
from .utils.startup import run_startup_hooks


# Loads the openslides setting. You can use your own settings by setting the
# environment variable DJANGO_SETTINGS_MODULE
setup_django_settings_module(local_installation=True)
application = get_wsgi_application()
run_startup_hooks()
