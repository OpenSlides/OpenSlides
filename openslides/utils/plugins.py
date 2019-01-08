import os
import pkgutil
import sys
from typing import Any, List, Tuple

from django.apps import apps
from django.conf import settings
from pkg_resources import iter_entry_points

from openslides.utils.main import (
    WINDOWS_PORTABLE_VERSION,
    detect_openslides_type,
    get_win32_portable_user_data_dir,
)


# Methods to collect plugins.


def collect_plugins_from_entry_points() -> Tuple[str, ...]:
    """
    Collects all entry points in the group openslides_plugins from all
    distributions in the default working set and returns their module names as
    tuple.
    """
    return tuple(
        entry_point.module_name
        for entry_point in iter_entry_points("openslides_plugins")
    )


def collect_plugins_from_dir(plugin_dir: str) -> Tuple[str, ...]:
    """
    Collects all modules/packages in the given `plugin_dir` and returns a tuple
    of their names.
    """
    return tuple(x[1] for x in pkgutil.iter_modules([plugin_dir]))


def collect_plugins() -> Tuple[str, ...]:
    """
    Collect all plugins that can be automatically discovered.
    """
    # Collect plugins from entry points.
    collected_plugins = collect_plugins_from_entry_points()

    # Collect plugins in plugins/ directory of portable.
    if detect_openslides_type() == WINDOWS_PORTABLE_VERSION:
        plugins_dir = os.path.join(get_win32_portable_user_data_dir(), "plugins")
        if plugins_dir not in sys.path:
            sys.path.append(plugins_dir)
        collected_plugins += collect_plugins_from_dir(plugins_dir)

    return collected_plugins


# Methods to retrieve plugin metadata and urlpatterns.


def get_plugin_verbose_name(plugin: str) -> str:
    """
    Returns the verbose name of a plugin. The plugin argument must be a python
    dotted module path.
    """
    return apps.get_app_config(plugin).verbose_name


def get_plugin_description(plugin: str) -> str:
    """
    Returns the short descrption of a plugin. The plugin argument must be a
    python dotted module path.
    """
    plugin_app_config = apps.get_app_config(plugin)
    try:
        description = plugin_app_config.get_description()
    except AttributeError:
        try:
            description = plugin_app_config.description
        except AttributeError:
            description = ""
    return description


def get_plugin_version(plugin: str) -> str:
    """
    Returns the version string of a plugin. The plugin argument must be a
    python dotted module path.
    """
    plugin_app_config = apps.get_app_config(plugin)
    try:
        version = plugin_app_config.get_version()
    except AttributeError:
        try:
            version = plugin_app_config.version
        except AttributeError:
            version = "unknown"
    return version


def get_plugin_license(plugin: str) -> str:
    """
    Returns the license string of a plugin. The plugin argument must be a
    python dotted module path.
    """
    plugin_app_config = apps.get_app_config(plugin)
    try:
        license = plugin_app_config.get_license()
    except AttributeError:
        try:
            license = plugin_app_config.license
        except AttributeError:
            license = ""
    return license


def get_plugin_url(plugin: str) -> str:
    """
    Returns the url of a plugin. The plugin argument must be a
    python dotted module path.
    """
    plugin_app_config = apps.get_app_config(plugin)
    try:
        url = plugin_app_config.get_url()
    except AttributeError:
        try:
            url = plugin_app_config.url
        except AttributeError:
            url = ""
    return url


def get_plugin_urlpatterns(plugin: str) -> Any:
    """
    Returns the urlpatterns object for a plugin. The plugin argument must be
    a python dotted module path.
    """
    plugin_app_config = apps.get_app_config(plugin)
    try:
        urlpatterns = plugin_app_config.get_urlpatterns()
    except AttributeError:
        try:
            urlpatterns = plugin_app_config.urlpatterns
        except AttributeError:
            urlpatterns = None
    return urlpatterns


def get_all_plugin_urlpatterns() -> List[Any]:
    """
    Helper function to return all urlpatterns of all plugins listed in
    settings.INSTALLED_PLUGINS.
    """
    urlpatterns: List[Any] = []
    for plugin in settings.INSTALLED_PLUGINS:
        plugin_urlpatterns = get_plugin_urlpatterns(plugin)
        if plugin_urlpatterns:
            urlpatterns += plugin_urlpatterns
    return urlpatterns
