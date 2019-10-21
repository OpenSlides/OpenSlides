from typing import Any, Dict

from django.apps import apps


def get_constants_from_apps() -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for app in apps.get_app_configs():
        try:
            # Each app can deliver values to angular when implementing this method.
            # It should return a list with dicts containing the 'name' and 'value'.
            get_angular_constants = app.get_angular_constants
        except AttributeError:
            # The app doesn't have this method. Continue to next app.
            continue
        out.update(get_angular_constants())
    return out


constants = None


def get_constants() -> Dict[str, Any]:
    """
    Returns the constants.

    This method only returns a static dict, so it is fast and can be used in a
    async context.
    """
    if constants is None:
        raise RuntimeError("Constants are not set.")
    return constants


def set_constants(value: Dict[str, Any]) -> None:
    """
    Sets the constants variable.
    """
    global constants
    constants = value


def set_constants_from_apps() -> None:
    set_constants(get_constants_from_apps())
