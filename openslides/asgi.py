from channels.asgi import get_channel_layer

from .utils.main import setup_django_settings_module

# Loads the openslides setting. You can use your own settings by setting the
# environment variable DJANGO_SETTINGS_MODULE
setup_django_settings_module()

channel_layer = get_channel_layer()
