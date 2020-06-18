import logging

from django.apps import AppConfig

from . import SAML_ENABLED
from .user_backend import SamlUserBackend


logger = logging.getLogger(__name__)


class SamlAppConfig(AppConfig):
    name = "openslides.saml"
    verbose_name = "OpenSlides SAML"
    user_backend_class = SamlUserBackend

    def get_angular_constants(self):
        from .settings import get_saml_settings

        return {"SamlSettings": get_saml_settings().general_settings}

    def get_startup_hooks(self):
        return {20: saml_startup}


def saml_startup():
    # Import all required stuff.
    from .settings import load_settings

    if not SAML_ENABLED:
        logger.info("SAML is disabled.")
        return

    load_settings()

    logger.info("SAML is enabled and loaded.")
