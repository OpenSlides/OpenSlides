# -*- coding: utf-8 -*-

from .exceptions import ConfigError, ConfigNotFound
from .models import ConfigStore
from .signals import config_signal


class ConfigHandler(object):
    """
    An simple object class to wrap the config variables. It is a container
    object. To get a config variable use x = config[...], to set it use
    config[...] = x.
    """
    def __getitem__(self, key):
        try:
            return self._cache[key]
        except KeyError:
            raise ConfigNotFound('The config variable %s was not found.' % key)
        except AttributeError:
            self.setup_cache()
            return self[key]

    def __setitem__(self, key, value):
        # Save the new value to the database
        updated_rows = ConfigStore.objects.filter(key=key).update(value=value)
        if not updated_rows:
            ConfigStore.objects.create(key=key, value=value)

        # Update cache
        try:
            self._cache[key] = value
        except AttributeError:
            # This happens, when a config-var is set, before __getitem__ was
            # called. In this case nothing should happen.
            pass

        # Call on_change callback
        for receiver, config_page in config_signal.send(sender='set_value'):
            for config_variable in config_page.variables:
                if config_variable.name == key and config_variable.on_change:
                    config_variable.on_change()
                    break

    def get_default(self, key):
        """
        Returns the default value for 'key'.
        """
        for receiver, config_page in config_signal.send(sender='get_default'):
            for config_variable in config_page.variables:
                if config_variable.name == key:
                    return config_variable.default_value
        raise ConfigNotFound('The config variable %s was not found.' % key)

    def setup_cache(self):
        """
        Loads all config variables from the database and by sending a
        signal to get the default into the cache.
        """
        self._cache = {}
        for receiver, config_page in config_signal.send(sender='setup_cache'):
            for config_variable in config_page.variables:
                if config_variable.name in self._cache:
                    raise ConfigError('Too many values for config variable %s found.' % config_variable.name)
                self._cache[config_variable.name] = config_variable.default_value
        for config_object in ConfigStore.objects.all():
            self._cache[config_object.key] = config_object.value

    def __contains__(self, key):
        try:
            config[key]
        except ConfigNotFound:
            return False
        else:
            return True


config = ConfigHandler()
"""
Final entry point to get an set config variables. To get a config variable
use x = config[...], to set it use config[...] = x.
"""


class ConfigBasePage(object):
    """
    An abstract base class for simple and grouped config pages. The
    attributes title and url are required. The attribute weight is used
    for the order of the links in the submenu of the views. The attribute
    extra_context can be used to insert extra css and js files into the
    template.
    """
    def __init__(self, title, url, required_permission=None, weight=0, extra_context={}):
        self.title = title
        self.url = url
        self.required_permission = required_permission
        self.weight = weight
        self.extra_context = extra_context

    def is_shown(self):
        """
        Returns True if at least one variable of the page has a form field.
        """
        for variable in self.variables:
            if variable.form_field is not None:
                return True
        else:
            return False


class ConfigGroupedPage(ConfigBasePage):
    """
    A simple object class for a grouped config page. Developers have to
    set the groups attribute (tuple). The config variables are available
    via the variables attribute. The page is shown as view in the config
    tab, if there is at least one variable with a form field.
    """
    def __init__(self, groups, **kwargs):
        self.groups = groups
        super(ConfigGroupedPage, self).__init__(**kwargs)

    @property
    def variables(self):
        for group in self.groups:
            for variable in group.variables:
                yield variable


class ConfigPage(ConfigBasePage):
    """
    A simple object class for a ungrouped config page. Developers have
    to set the variables (tuple) directly. The page is shown as view in
    the config tab, if there is at least one variable with a form field.
    """
    def __init__(self, variables, **kwargs):
        self.variables = variables
        super(ConfigPage, self).__init__(**kwargs)


class ConfigGroup(object):
    """
    A simple object class representing a group of variables (tuple) with
    a special title.
    """
    def __init__(self, title, variables):
        self.title = title
        self.variables = variables

    def get_field_names(self):
        return [variable.name for variable in self.variables if variable.form_field is not None]


class ConfigVariable(object):
    """
    A simple object class to wrap new config variables. The keyword
    arguments 'name' and 'default_value' are required. The keyword
    argument 'form_field' has to be set, if the variable should appear
    on the ConfigView. The argument 'on_change' can get a callback
    which is called every time, the variable is changed.
    """
    def __init__(self, name, default_value, form_field=None, on_change=None):
        self.name = name
        self.default_value = default_value
        self.form_field = form_field
        self.on_change = on_change
