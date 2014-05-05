# -*- coding: utf-8 -*-

import os
import pkgutil
import sys

from django.utils.importlib import import_module
from pkg_resources import iter_entry_points

from openslides.utils.main import (
    detect_openslides_type,
    WINDOWS_PORTABLE_VERSION,
    get_win32_portable_user_data_path,
)

plugins = {}


def get_plugins_from_entry_points():
    """
    Collects all entry points in the group openslides_plugins from all
    distributions in the default working set and returns their module names as
    tuple.
    """
    return tuple(entry_point.module_name for entry_point in iter_entry_points('openslides_plugins'))


def get_plugins_from_path(path):
    """
    Collects all modules/packages in the given `path`
    and returns a tuple of their names
    """
    importer = pkgutil.get_importer(path)
    return tuple(x[0] for x in importer.iter_modules())


def collect_plugins():
    """
    Collect all plugins that can be automatically discovered.
    """
    plugins = get_plugins_from_entry_points()
    # add all modules in plugins/ dir of portable automatically
    if detect_openslides_type() == WINDOWS_PORTABLE_VERSION:
        plugins_path = os.path.join(
            get_win32_portable_user_data_path(), "plugins")
        if plugins_path not in sys.path:
            sys.path.append(plugins_path)
        plugins += get_plugins_from_path(plugins_path)
    return plugins


def get_plugin(plugin):
    """
    Returns the imported module. The plugin argument must be a python dotted
    module path.
    """
    try:
        plugin = plugins[plugin]
    except KeyError:
        plugins[plugin] = import_module(plugin)
        plugin = get_plugin(plugin)
    return plugin


def get_plugin_verbose_name(plugin):
    """
    Returns the verbose name of a plugin. The plugin argument must be a python
    dotted module path.
    """
    plugin = get_plugin(plugin)
    try:
        verbose_name = plugin.get_verbose_name()
    except AttributeError:
        try:
            verbose_name = plugin.__verbose_name__
        except AttributeError:
            verbose_name = plugin.__name__
    return verbose_name


def get_plugin_description(plugin):
    """
    Returns the short descrption of a plugin. The plugin argument must be a
    python dotted module path.
    """
    plugin = get_plugin(plugin)
    try:
        description = plugin.get_description()
    except AttributeError:
        try:
            description = plugin.__description__
        except AttributeError:
            description = ''
    return description


def get_plugin_version(plugin):
    """
    Returns the version string of a plugin. The plugin argument must be a#
    python dotted module path.
    """
    plugin = get_plugin(plugin)
    try:
        version = plugin.get_version()
    except AttributeError:
        try:
            version = plugin.__version__
        except AttributeError:
            version = 'unknown'
    return version


def get_urlpatterns(plugin):
    """
    Returns the urlpatterns object for a plugin. The plugin argument must be
    a python dotted module path.
    """
    plugin = get_plugin(plugin)
    try:
        urlpatterns = plugin.urlpatterns
    except AttributeError:
        try:
            urlpatterns = plugin.urls.urlpatterns
        except AttributeError:
            urlpatterns = None
    return urlpatterns
