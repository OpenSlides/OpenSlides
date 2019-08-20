from typing import List

from openslides.users.user_backend import BaseUserBackend

from .settings import get_saml_settings


class SamlUserBackend(BaseUserBackend):
    """
    User backend for SAML users.
    Disallowed update keys are the keys given by the IDP.
    """

    def __init__(self):
        self.disallowed_update_keys: List[str] = [
            os_attribute
            for os_attribute, _ in get_saml_settings().attribute_mapping.values()
        ]

    @property
    def name(self) -> str:
        return "saml"

    def get_disallowed_update_keys(self) -> List[str]:
        return self.disallowed_update_keys
