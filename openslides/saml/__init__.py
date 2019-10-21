from django.conf import settings

from .exceptions import SamlException


default_app_config = "openslides.saml.apps.SamlAppConfig"


SAML_ENABLED = getattr(settings, "ENABLE_SAML", False)

if SAML_ENABLED:
    try:
        import onelogin.saml2  # noqa
    except ImportError:
        raise SamlException(
            "SAML is enabled, but we could not import onelogin.saml2. Is python3-saml installed?"
        )
