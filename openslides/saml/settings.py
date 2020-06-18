import json
import logging
import os
from typing import Dict, Tuple

from django.conf import settings
from onelogin.saml2.settings import OneLogin_Saml2_Settings

from .exceptions import SamlException


logger = logging.getLogger(__name__)


README = """\
Take care of this folder that could contain private key. Be sure that this folder never is published.
OpenSlides SAML plugin expects that certs for the SP could be stored in this folder as:
 * sp.key     Private Key
 * sp.crt     Public cert
 * sp_new.crt Future Public cert
Also you can use other cert to sign the metadata of the SP using the:
 * metadata.key
 * metadata.crt"""


def get_settings_dir_and_path() -> Tuple[str, str]:
    """
    Returns the settings directory and as the seconds return value
    the path to the saml settings file.
    """
    try:
        settings_dir = os.path.dirname(os.path.abspath(settings.SETTINGS_FILEPATH))
    except AttributeError:
        raise SamlException(
            "'SETTINGS_FILEPATH' is not in your settings.py. "
            + "Would you kindly add the following line: 'SETTINGS_FILEPATH = __file__'?"
        )
    settings_path = os.path.join(settings_dir, "saml_settings.json")
    return settings_dir, settings_path


def create_saml_settings(
    settings_path: str = None, template: str = None, **context: str
) -> None:
    """
    Creates the SAML settings file 'saml_settings.json'

    if the path is given, the settings will be written! If not, it is checked, if the
    settings do exists.
    """
    # If settings_path is none, do not force writing the file.
    if settings_path is None:
        # Check, if the file exists and exit then.
        _, settings_path = get_settings_dir_and_path()
        if os.path.isfile(settings_path):
            return  # it exist.

    # OK, write the file.
    settings_path = os.path.realpath(settings_path)
    if template is None:
        with open(
            os.path.join(os.path.dirname(__file__), "saml_settings.json.tpl")
        ) as template_file:
            template = template_file.read()
    content = template % context
    with open(settings_path, "w") as settings_file:
        settings_file.write(content)

    # create cert folder and add thr README
    cert_dir = os.path.join(os.path.dirname(settings_path), "certs")
    os.makedirs(cert_dir, exist_ok=True)

    # create README there
    readme_path = os.path.join(cert_dir, "README")
    if not os.path.isfile(readme_path):
        with open(readme_path, "w") as readme:
            readme.write(README)
        logger.info(f"Written README into the certs folder: {cert_dir}")
    logger.info(f"Created SAML settings at: {settings_path}")


class SamlSettings:
    """
    Holds all custom settings and saml settings from the saml_settings.json

    Custom Settings:
    - general_settings: {
        loginButtonText: <str>,
        changePasswordUrl: <str>
      }
    - attribute_mapping: {
        <idp_attr>: [<OS_attr>, <lookup>]
      }
    - request_settings: {
        <key>: <value>,
      }
    - default_group_ids: [<id>, ...] | null | undefined
    """

    def __init__(self):
        create_saml_settings()
        self.load_settings()

    def load_settings(self):
        # Try to open the settings file.
        content = None
        settings_dir, settings_path = get_settings_dir_and_path()
        try:
            with open(settings_path, "r") as settings_file:
                content = json.load(settings_file)
        except IOError:
            raise SamlException(
                f"Could not read settings file located at: {settings_path}"
            )
        except json.JSONDecodeError:
            raise SamlException(
                f"The settings file located at {settings_path} could not be loaded."
            )
        logger.info(f"Loaded settings: {settings_path}")

        # Extract special settings
        self.load_general_settings(content)
        self.load_attribute_mapping(content)
        self.load_request_settings(content)
        self.load_default_group_ids(content)

        # Load saml settings
        self.saml_settings = OneLogin_Saml2_Settings(
            content, custom_base_path=settings_dir
        )

    def load_general_settings(self, content):
        if "generalSettings" not in content:
            raise SamlException(
                "The saml_settings.json does not contain 'generalSettings'!"
            )
        self.general_settings = content.pop("generalSettings")

        if not isinstance(self.general_settings, dict):
            raise SamlException("The generalSettings have to be a dict.")
        if "loginButtonText" not in self.general_settings:
            raise SamlException("The loginButtonText is not given.")
        if not isinstance(self.general_settings["loginButtonText"], str):
            raise SamlException("The loginButtonText has to be a string.")
        if "changePasswordUrl" not in self.general_settings:
            raise SamlException("The changePasswordUrl is not given.")
        if not isinstance(self.general_settings["changePasswordUrl"], str):
            raise SamlException("The changePasswordUrl has to be a string.")

    def load_attribute_mapping(self, content):
        if "attributeMapping" not in content:
            raise SamlException(
                "The saml_settings.json does not contain 'attributeMapping'!"
            )
        self.attribute_mapping = content.pop("attributeMapping")

        allowed_attributes = [
            "username",
            "first_name",
            "last_name",
            "gender",
            "email",
            "title",
            "structure_level",
            "number",
            "comment",
            "is_active",
            "is_present",
            "is_committee",
        ]

        one_lookup_true = False
        if not isinstance(self.attribute_mapping, dict):
            raise SamlException("The attributeMapping is not a dict.")
        for key, value in self.attribute_mapping.items():
            if not isinstance(key, str):
                raise SamlException(f'The key "{key}" has to be a string.')
            if not isinstance(value, list):
                raise SamlException(f'The value from key "{key}" has to be a list.')
            if not len(value) == 2:
                raise SamlException(f'The value from key "{key}" has ot two entries.')
            os_attribute, lookup = value
            if not isinstance(os_attribute, str):
                raise SamlException(
                    f'The first value from key "{key}" has to be a string.'
                )
            if os_attribute not in allowed_attributes:
                all_attrs = ", ".join(allowed_attributes)
                raise SamlException(
                    f"The attribute {os_attribute} is not allowed. All allowed attributes: {all_attrs}"
                )
            if not isinstance(value[1], bool):
                raise SamlException(
                    f'The lookup value from key "{key}" has to be a boolean.'
                )
            if value[1]:
                one_lookup_true = True

        if not one_lookup_true:
            raise SamlException(
                "At least one attribute has to be used as a lookup value."
            )

    def load_request_settings(self, content):
        self.request_settings: Dict[str, str] = {}
        if "requestSettings" in content:
            self.request_settings = content.pop("requestSettings")

            if not isinstance(self.request_settings, dict):
                raise SamlException("The requestSettings have to be a dict")
            if "https" in self.request_settings and self.request_settings[
                "https"
            ] not in ("on", "off"):
                raise SamlException('The https value must be "on" or "off"')

    def load_default_group_ids(self, content):
        self.default_group_ids = content.pop("defaultGroupIds", None)
        if self.default_group_ids is None:
            return
        if not isinstance(self.default_group_ids, list):
            raise SamlException(
                "default_group_ids must be null (or not present) or a list of integers"
            )
        for id in self.default_group_ids:
            if not isinstance(id, int):
                raise SamlException(
                    "default_group_ids must be null (or not present) or a list of integers"
                )


saml_settings = None


def get_saml_settings():
    global saml_settings
    return saml_settings


def load_settings():
    global saml_settings
    saml_settings = SamlSettings()
