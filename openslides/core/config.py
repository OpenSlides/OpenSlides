from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import ugettext as _

from .exceptions import ConfigError, ConfigNotFound
from .models import ConfigStore

INPUT_TYPE_MAPPING = {
    'string': str,
    'text': str,
    'integer': int,
    'boolean': bool,
    'choice': str,
    'colorpicker': str}


class ConfigHandler:
    """
    A simple object class to wrap the config variables. It is a container
    object. To get a config variable use x = config[...], to set it use
    config[...] = x.
    """
    def __getitem__(self, key):
        """
        Returns the value of the config variable. Builds the cache if it
        does not exist.
        """
        try:
            return self._cache[key]
        except KeyError:
            raise ConfigNotFound(_('The config variable %s was not found.') % key)
        except AttributeError:
            self.setup_cache()
            return self[key]

    def setup_cache(self):
        """
        Creates a cache of all config variables with their current value.
        """
        self._cache = {}
        for key, config_variable in self.get_config_variables().items():
            self._cache[key] = config_variable.default_value
        for config_object in ConfigStore.objects.all():
            self._cache[config_object.key] = config_object.value

    def __contains__(self, key):
        try:
            config[key]
        except ConfigNotFound:
            return False
        else:
            return True

    def __setitem__(self, key, value):
        """
        Sets the new value. First it validates the input.
        """
        # Check if the variable is defined.
        try:
            config_variable = config.get_config_variables()[key]
        except KeyError:
            raise ConfigNotFound(_('The config variable %s was not found.') % key)

        # Validate datatype and run validators.
        expected_type = INPUT_TYPE_MAPPING[config_variable.input_type]

        # Try to convert value into the expected datatype
        try:
            value = expected_type(value)
        except ValueError:
            raise ConfigError(_('Wrong datatype. Expected %(expected_type)s, got %(got_type)s.') % {
                'expected_type': expected_type, 'got_type': type(value)})
        if config_variable.input_type == 'choice' and value not in map(lambda choice: choice['value'], config_variable.choices):
            raise ConfigError(_('Invalid input. Choice does not match.'))
        for validator in config_variable.validators:
            try:
                validator(value)
            except DjangoValidationError as e:
                raise ConfigError(e.messages[0])

        # Save the new value to the database.
        config_store, created = ConfigStore.objects.get_or_create(key=key, defaults={'value': value})
        if not created:
            config_store.value = value
            config_store.save()

        # Update cache.
        if hasattr(self, '_cache'):
            self._cache[key] = value

        # Call on_change callback.
        if config_variable.on_change:
            config_variable.on_change()

    def items(self):
        """
        Returns key-value pairs of all config variables.
        """
        if not hasattr(self, '_cache'):
            self.setup_cache()
        return self._cache.items()

    def get_config_variables(self):
        """
        Returns a dictionary with all ConfigVariable instances of all
        signal receivers. The key is the name of the config variable.
        """
        # config_signal can not be imported at global space, because
        # core.signals imports this file
        from .signals import config_signal

        result = {}
        for receiver, config_collection in config_signal.send(sender='get_config_variables'):
            for config_variable in config_collection:
                if config_variable.name in result:
                    raise ConfigError(_('Too many values for config variable %s found.') % config_variable.name)
                result[config_variable.name] = config_variable
        return result

    def get_all_translatable(self):
        """
        Generator to get all config variables as strings when their values are
        intended to be translated.
        """
        for config_variable in self.get_config_variables().values():
            if config_variable.translatable:
                yield config_variable.name

config = ConfigHandler()
"""
Final entry point to get an set config variables. To get a config variable
use x = config[...], to set it use config[...] = x.
"""


class ConfigVariable:
    """
    A simple object class to wrap new config variables.

    The keyword arguments 'name' and 'default_value' are required.

    The keyword arguments 'input_type', 'label', 'help_text' and 'hidden'
    are for rendering a HTML form element. The 'input_type is also used for
    validation. If you set 'input_type' to 'choice' you have to provide
    'choices', which is a list of dictionaries containing a value and a
    display_name of every possible choice.

    The keyword arguments 'weight', 'group' and 'subgroup' are for sorting
    and grouping.

    The keyword argument validators expects an interable of validator
    functions. Such a function gets the value and raises Django's
    ValidationError if the value is invalid.

    The keyword argument 'on_change' can be a callback which is called
    every time, the variable is changed.

    If the argument 'translatable' is set, OpenSlides is able to translate
    the value during setup of the database if the admin uses the respective
    command line option.
    """
    def __init__(self, name, default_value, input_type='string', label=None,
                 help_text=None, choices=None, hidden=False, weight=0,
                 group=None, subgroup=None, validators=None, on_change=None,
                 translatable=False):
        if input_type not in INPUT_TYPE_MAPPING:
            raise ValueError(_('Invalid value for config attribute input_type.'))
        if input_type == 'choice' and choices is None:
            raise ConfigError(_("Either config attribute 'choices' must not be None or "
                                "'input_type' must not be 'choice'."))
        elif input_type != 'choice' and choices is not None:
            raise ConfigError(_("Either config attribute 'choices' must be None or "
                                "'input_type' must be 'choice'."))
        self.name = name
        self.default_value = default_value
        self.input_type = input_type
        self.label = label or name
        self.help_text = help_text or ''
        self.choices = choices
        self.hidden = hidden
        self.weight = weight
        self.group = group or _('General')
        self.subgroup = subgroup
        self.validators = validators or ()
        self.on_change = on_change
        self.translatable = translatable

    @property
    def data(self):
        """
        Property with all data for OPTIONS requests.
        """
        data = {
            'key': self.name,
            'default_value': self.default_value,
            'value': config[self.name],
            'input_type': self.input_type,
            'label': self.label,
            'help_text': self.help_text,
        }
        if self.input_type == 'choice':
            data['choices'] = self.choices
        return data

    def is_hidden(self):
        """
        Returns True if the config variable is hidden so it can be removed
        from response of OPTIONS request.
        """
        return self.hidden
