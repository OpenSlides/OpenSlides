"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import django
from channels.routing import get_default_application

from .utils.main import setup_django_settings_module
from .utils.startup import run_startup_hooks


# Loads the openslides setting. You can use your own settings by setting the
# environment variable DJANGO_SETTINGS_MODULE
setup_django_settings_module()
django.setup()
run_startup_hooks()
application = get_default_application()
