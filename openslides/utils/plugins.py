# -*- coding: utf-8 -*-

from django.utils.importlib import import_module

plugins = {}


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
