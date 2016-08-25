from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import ugettext as _

from .exceptions import ConfigError, ConfigNotFound
from .models import ConfigStore

# remove resolution when changing to multiprojector
INPUT_TYPE_MAPPING = {
    'string': str,
    'text': str,
    'integer': int,
    'boolean': bool,
    'choice': str,
    'colorpicker': str,
    'resolution': dict}


class ConfigHandler:
    """
    A simple object class to wrap the config variables. It is a container
    object. To get a config variable use x = config[...], to set it use
    config[...] = x.
    """

    def __init__(self):
        # Dict, that keeps all ConfigVariable objects. Has to be set at statup.
        # See the run method in openslides.core.apps.
        self.config_variables = {}

    def __getitem__(self, key):
        """
        Returns the value of the config variable. Returns the default value, if
        not value exists in the database.
        """
        try:
            default_value = self.config_variables[key].default_value
        except KeyError:
            raise ConfigNotFound(_('The config variable {} was not found.').format(key))

        try:
            db_value = ConfigStore.objects.get(key=key)
        except ConfigStore.DoesNotExist:
            return default_value
        return db_value.value

    def __contains__(self, key):
        """
        Returns True, if the config varialbe exists.
        """
        try:
            self.config_variables[key]
        except KeyError:
            return False
        else:
            return True

    def __setitem__(self, key, value):
        """
        Sets the new value. First it validates the input.
        """
        # Check if the variable is defined.
        try:
            config_variable = self.config_variables[key]
        except KeyError:
            raise ConfigNotFound(_('The config variable {} was not found.').format(key))

        # Validate datatype and run validators.
        expected_type = INPUT_TYPE_MAPPING[config_variable.input_type]

        # Try to convert value into the expected datatype
        try:
            value = expected_type(value)
        except ValueError:
            raise ConfigError(_('Wrong datatype. Expected %(expected_type)s, got %(got_type)s.') % {
                'expected_type': expected_type, 'got_type': type(value)})

        if config_variable.input_type == 'choice':
            # Choices can be a callable. In this case call it at this place
            if callable(config_variable.choices):
                choices = config_variable.choices()
            else:
                choices = config_variable.choices
            if value not in map(lambda choice: choice['value'], choices):
                raise ConfigError(_('Invalid input. Choice does not match.'))
        for validator in config_variable.validators:
            try:
                validator(value)
            except DjangoValidationError as e:
                raise ConfigError(e.messages[0])

        # remove this block when changing to multiprojector
        if config_variable.input_type == 'resolution':
            if value.get('width') is None or value.get('height') is None:
                raise ConfigError(_('A width and a height have to be given.'))
            if not isinstance(value['width'], int) or not isinstance(value['height'], int):
                raise ConfigError(_('Data has to be integers.'))
            if (value['width'] < 800 or value['width'] > 3840 or
                    value['height'] < 600 or value['height'] > 2160):
                raise ConfigError(_('The Resolution have to be between 800x600 and 3840x2160.'))

        # Save the new value to the database.
        ConfigStore.objects.update_or_create(key=key, defaults={'value': value})

        # Call on_change callback.
        if config_variable.on_change:
            config_variable.on_change()

    def update_config_variables(self, items):
        """
        Updates the config_variables dict.

        items has to be an iterator over ConfigVariable objects.
        """
        new_items = dict((variable.name, variable) for variable in items)
        # Check that all ConfigVariables are unique. So no key from items can
        # be in already in self.config_variables
        for key in new_items.keys():
            if key in self.config_variables:
                raise ConfigError(_('Too many values for config variable {} found.').format(key))

        self.config_variables.update(new_items)

    def items(self):
        """
        Iterates over key-value pairs of all config variables.
        """
        # Create a dict with the default values of each ConfigVariable
        config_items = dict((key, variable.default_value) for key, variable in self.config_variables.items())

        # Update the dict with all values, which are in the db
        for db_value in ConfigStore.objects.all():
            config_items[db_value.key] = db_value.value
        return config_items.items()

    def get_all_translatable(self):
        """
        Generator to get all config variables as strings when their values are
        intended to be translated.
        """
        for config_variable in self.config_variables.values():
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
            data['choices'] = self.choices() if callable(self.choices) else self.choices
        return data

    def is_hidden(self):
        """
        Returns True if the config variable is hidden so it can be removed
        from response of OPTIONS request.
        """
        return self.hidden
