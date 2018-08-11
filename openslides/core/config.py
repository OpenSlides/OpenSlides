from typing import Any, Callable, Dict, Iterable, Optional, TypeVar, Union

from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import ugettext as _
from mypy_extensions import TypedDict

from ..utils.collection import CollectionElement
from .exceptions import ConfigError, ConfigNotFound
from .models import ConfigStore

INPUT_TYPE_MAPPING = {
    'string': str,
    'text': str,
    'markupText': str,
    'integer': int,
    'boolean': bool,
    'choice': str,
    'comments': dict,
    'colorpicker': str,
    'datetimepicker': int,
    'majorityMethod': str,
    'static': dict,
    'translations': list,
}


class ConfigHandler:
    """
    A simple object class to wrap the config variables. It is a container
    object. To get a config variable use x = config[...], to set it use
    config[...] = x.
    """

    def __init__(self) -> None:
        # Dict, that keeps all ConfigVariable objects. Has to be set at statup.
        # See the ready() method in openslides.core.apps.
        self.config_variables = {}  # type: Dict[str, ConfigVariable]

        # Index to get the database id from a given config key
        self.key_to_id = {}  # type: Dict[str, int]

    def __getitem__(self, key: str) -> Any:
        """
        Returns the value of the config variable.
        """
        # Build the key_to_id dict
        self.save_default_values()

        if not self.exists(key):
            raise ConfigNotFound(_('The config variable {} was not found.').format(key))

        return CollectionElement.from_values(
            self.get_collection_string(),
            self.key_to_id[key]).get_full_data()['value']

    def exists(self, key: str) -> bool:
        """
        Returns True, if the config varialbe was defined.
        """
        try:
            self.config_variables[key]
        except KeyError:
            return False
        else:
            return True

    # TODO: Remove the any by using right types in INPUT_TYPE_MAPPING
    def __setitem__(self, key: str, value: Any) -> None:
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
            if choices is None or value not in map(lambda choice: choice['value'], choices):
                raise ConfigError(_('Invalid input. Choice does not match.'))

        for validator in config_variable.validators:
            try:
                validator(value)
            except DjangoValidationError as e:
                raise ConfigError(e.messages[0])

        if config_variable.input_type == 'comments':
            if not isinstance(value, dict):
                raise ConfigError(_('motions_comments has to be a dict.'))
            valuecopy = dict()
            for id, commentsfield in value.items():
                try:
                    id = int(id)
                except ValueError:
                    raise ConfigError(_('Each id has to be an int.'))

                if id < 1:
                    raise ConfigError(_('Each id has to be greater then 0.'))
                # Deleted commentsfields are saved as None to block the used ids
                if commentsfield is not None:
                    if not isinstance(commentsfield, dict):
                        raise ConfigError(_('Each commentsfield in motions_comments has to be a dict.'))
                    if commentsfield.get('name') is None or commentsfield.get('public') is None:
                        raise ConfigError(_('A name and a public property have to be given.'))
                    if not isinstance(commentsfield['name'], str):
                        raise ConfigError(_('name has to be string.'))
                    if not isinstance(commentsfield['public'], bool):
                        raise ConfigError(_('public property has to be bool.'))
                valuecopy[id] = commentsfield
            value = valuecopy

        if config_variable.input_type == 'static':
            if not isinstance(value, dict):
                raise ConfigError(_('This has to be a dict.'))
            whitelist = (
                'path',
                'display_name',
            )
            for required_entry in whitelist:
                if required_entry not in value:
                    raise ConfigError(_('{} has to be given.'.format(required_entry)))
                if not isinstance(value[required_entry], str):
                    raise ConfigError(_('{} has to be a string.'.format(required_entry)))

        if config_variable.input_type == 'translations':
            if not isinstance(value, list):
                raise ConfigError(_('Translations has to be a list.'))
            for entry in value:
                if not isinstance(entry, dict):
                    raise ConfigError(_('Every value has to be a dict, not {}.'.format(type(entry))))
                whitelist = (
                    'original',
                    'translation',
                )
                for required_entry in whitelist:
                    if required_entry not in entry:
                        raise ConfigError(_('{} has to be given.'.format(required_entry)))
                    if not isinstance(entry[required_entry], str):
                        raise ConfigError(_('{} has to be a string.'.format(required_entry)))

        # Save the new value to the database.
        db_value = ConfigStore.objects.get(key=key)
        db_value.value = value
        db_value.save(information={'changed_config': key})

        # Call on_change callback.
        if config_variable.on_change:
            config_variable.on_change()

    def update_config_variables(self, items: Iterable['ConfigVariable']) -> None:
        """
        Updates the config_variables dict.
        """
        # build an index from variable name to the variable
        item_index = dict((variable.name, variable) for variable in items)

        # Check that all ConfigVariables are unique. So no key from items can
        # be in already in self.config_variables
        intersection = set(item_index.keys()).intersection(self.config_variables.keys())
        if intersection:
            raise ConfigError(_('Too many values for config variables {} found.').format(intersection))

        self.config_variables.update(item_index)

    def save_default_values(self) -> None:
        """
        Saves the default values to the database.

        Does also build the dictonary key_to_id.

        Does nothing on a second run.
        """
        if not self.key_to_id:
            for item in self.config_variables.values():
                try:
                    db_value = ConfigStore.objects.get(key=item.name)
                except ConfigStore.DoesNotExist:
                    db_value = ConfigStore()
                    db_value.key = item.name
                    db_value.value = item.default_value
                    db_value.save(skip_autoupdate=True)
                self.key_to_id[item.name] = db_value.pk

    def get_collection_string(self) -> str:
        """
        Returns the collection_string from the CollectionStore.
        """
        return ConfigStore.get_collection_string()


config = ConfigHandler()
"""
Final entry point to get an set config variables. To get a config variable
use x = config[...], to set it use config[...] = x.
"""


T = TypeVar('T')
ChoiceType = Optional[Iterable[Dict[str, str]]]
ChoiceCallableType = Union[ChoiceType, Callable[[], ChoiceType]]
ValidatorsType = Iterable[Callable[[T], None]]
OnChangeType = Callable[[], None]
ConfigVariableDict = TypedDict('ConfigVariableDict', {
    'key': str,
    'default_value': Any,
    'value': Any,
    'input_type': str,
    'label': str,
    'help_text': str,
    'choices': ChoiceType,
})


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
    def __init__(self, name: str, default_value: T, input_type: str = 'string',
                 label: str = None, help_text: str = None, choices: ChoiceCallableType = None,
                 hidden: bool = False, weight: int = 0, group: str = None, subgroup: str = None,
                 validators: ValidatorsType = None, on_change: OnChangeType = None) -> None:
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

    @property
    def data(self) -> ConfigVariableDict:
        """
        Property with all data for AngularJS variable on startup.
        """
        return ConfigVariableDict(
            key=self.name,
            default_value=self.default_value,
            value=config[self.name],
            input_type=self.input_type,
            label=self.label,
            help_text=self.help_text,
            choices=self.choices() if callable(self.choices) else self.choices
        )

    def is_hidden(self) -> bool:
        """
        Returns True if the config variable is hidden so it can be removed
        from response of OPTIONS request.
        """
        return self.hidden
