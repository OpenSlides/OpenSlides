"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import django
from channels.routing import get_default_application

from .core.apps import startup
from .utils.main import setup_django_settings_module


# Loads the openslides setting. You can use your own settings by setting the
# environment variable DJANGO_SETTINGS_MODULE
setup_django_settings_module()
django.setup()
startup()
application = get_default_application()
