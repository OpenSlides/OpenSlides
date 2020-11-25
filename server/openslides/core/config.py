from typing import Any, Callable, Dict, Iterable, Optional, TypeVar, Union, cast

from asgiref.sync import async_to_sync
from django.apps import apps
from django.core.exceptions import ValidationError as DjangoValidationError
from mypy_extensions import TypedDict

from ..utils.cache import element_cache
from ..utils.validate import validate_html_permissive, validate_html_strict
from .exceptions import ConfigError, ConfigNotFound
from .models import ConfigStore


INPUT_TYPE_MAPPING = {
    "string": str,
    "text": str,
    "markupText": str,
    "integer": int,
    "boolean": bool,
    "choice": str,
    "colorpicker": str,
    "datetimepicker": int,
    "static": dict,
    "translations": list,
    "groups": list,
}

ALLOWED_NONE = ("datetimepicker",)


class ConfigHandler:
    """
    A simple object class to wrap the config variables. It is a container
    object. To get a config variable use x = config[...], to set it use
    config[...] = x.
    """

    def __init__(self) -> None:
        # Dict, that keeps all ConfigVariable objects. Has to be set at statup.
        # See the ready() method in openslides.core.apps.
        self.config_variables: Dict[str, ConfigVariable] = {}

        # Index to get the database id from a given config key
        self.key_to_id: Optional[Dict[str, int]] = None

    def __getitem__(self, key: str) -> Any:
        """
        Returns the value of the config variable.
        """
        if not self.exists(key):
            raise ConfigNotFound(f"The config variable {key} was not found.")

        return async_to_sync(element_cache.get_element_data)(
            self.get_collection_string(), self.get_key_to_id()[key]
        )["value"]

    def get_key_to_id(self) -> Dict[str, int]:
        """
        Returns the key_to_id dict. Builds it, if it does not exist.
        """
        if self.key_to_id is None:
            async_to_sync(self.build_key_to_id)()
            self.key_to_id = cast(Dict[str, int], self.key_to_id)
        return self.key_to_id

    async def async_get_key_to_id(self) -> Dict[str, int]:
        """
        Like get_key_to_id but in an async context.
        """
        if self.key_to_id is None:
            await self.build_key_to_id()
            self.key_to_id = cast(Dict[str, int], self.key_to_id)
        return self.key_to_id

    async def build_key_to_id(self) -> None:
        """
        Build the key_to_id dict, if it does not exists.
        """
        if self.key_to_id is not None:
            return

        config_full_data = await element_cache.get_collection_data(
            self.get_collection_string()
        )
        elements = config_full_data.values()
        self.key_to_id = {}
        for element in elements:
            self.key_to_id[element["key"]] = element["id"]

    def exists(self, key: str) -> bool:
        """
        Returns True, if the config varialbe was defined.
        """
        return key in self.config_variables

    # TODO: Remove the any by using right types in INPUT_TYPE_MAPPING
    def __setitem__(self, key: str, value: Any) -> None:
        """
        Sets the new value. First it validates the input.
        """
        # Check if the variable is defined.
        try:
            config_variable = self.config_variables[key]
        except KeyError:
            raise ConfigNotFound(f"The config variable {key} was not found.")

        # Validate datatype and run validators.
        expected_type = INPUT_TYPE_MAPPING[config_variable.input_type]

        # Try to convert value into the expected datatype
        if value is None and config_variable.input_type not in ALLOWED_NONE:
            raise ConfigError(f"Got None for {key}")
        elif value is not None:
            try:
                value = expected_type(value)
            except (ValueError, TypeError):
                raise ConfigError(
                    f"Wrong datatype. Expected {expected_type}, got {type(value)}."
                )

        if config_variable.input_type == "choice":
            # Choices can be a callable. In this case call it at this place
            if callable(config_variable.choices):
                choices = config_variable.choices()
            else:
                choices = config_variable.choices
            if choices is None or value not in map(
                lambda choice: choice["value"], choices
            ):
                raise ConfigError("Invalid input. Choice does not match.")

        if config_variable.input_type == "groups":
            from ..users.models import Group

            groups = set(group.id for group in Group.objects.all())
            if not groups.issuperset(set(value)):
                raise ConfigError("Invalid input. Chosen group does not exist.")

        for validator in config_variable.validators:
            try:
                validator(value)
            except DjangoValidationError as err:
                raise ConfigError(err.messages[0])

        if config_variable.input_type == "static":
            if not isinstance(value, dict):
                raise ConfigError("This has to be a dict.")
            whitelist = ("path", "display_name")
            for required_entry in whitelist:
                if required_entry not in value:
                    raise ConfigError(f"{required_entry} has to be given.")
                if not isinstance(value[required_entry], str):
                    raise ConfigError(f"{required_entry} has to be a string.")

        if config_variable.input_type == "translations":
            if not isinstance(value, list):
                raise ConfigError("Translations has to be a list.")
            for entry in value:
                if not isinstance(entry, dict):
                    raise ConfigError(
                        f"Every value has to be a dict, not {type(entry)}."
                    )
                whitelist = ("original", "translation")
                for required_entry in whitelist:
                    if required_entry not in entry:
                        raise ConfigError(f"{required_entry} has to be given.")
                    if not isinstance(entry[required_entry], str):
                        raise ConfigError(f"{required_entry} has to be a string.")

        if config_variable.input_type == "markupText":
            if config_variable.name == "general_event_welcome_text":
                value = validate_html_permissive(value)
            else:
                value = validate_html_strict(value)

        # Save the new value to the database.
        db_value = ConfigStore.objects.get(key=key)
        db_value.value = value
        db_value.save()

        # Call on_change callback.
        if config_variable.on_change:
            config_variable.on_change()

    def collect_config_variables_from_apps(self) -> None:
        for app in apps.get_app_configs():
            try:
                # Each app can deliver config variables when implementing the
                # get_config_variables method.
                get_config_variables = app.get_config_variables
            except AttributeError:
                # The app doesn't have this method. Continue to next app.
                continue
            self.update_config_variables(get_config_variables())

    def update_config_variables(self, items: Iterable["ConfigVariable"]) -> None:
        """
        Updates the config_variables dict.
        """
        # build an index from variable name to the variable
        item_index = dict((variable.name, variable) for variable in items)

        # Check that all ConfigVariables are unique. So no key from items can
        # be in already in self.config_variables
        intersection = set(item_index.keys()).intersection(self.config_variables.keys())
        if intersection:
            raise ConfigError(
                f"Too many values for config variables {intersection} found."
            )

        self.config_variables.update(item_index)

    def save_default_values(self) -> bool:
        """
        Saves the default values to the database. Does also build the dictonary key_to_id.

        Returns True, if something in the DB was changed.
        """
        self.key_to_id = {}
        altered_config = False
        for item in self.config_variables.values():
            try:
                db_value = ConfigStore.objects.get(key=item.name)
            except ConfigStore.DoesNotExist:
                db_value = ConfigStore()
                db_value.key = item.name
                db_value.value = item.default_value
                db_value.save(skip_autoupdate=True)
                altered_config = True
            self.key_to_id[db_value.key] = db_value.id
        return altered_config

    def increment_version(self) -> None:
        """
        Increments the config key "config_version"
        """
        db_value = ConfigStore.objects.get(key="config_version")
        db_value.value = db_value.value + 1
        db_value.save(skip_autoupdate=True)

    def cleanup_old_config_values(self) -> bool:
        """
        Deletes all config variable in the database, if the keys are not
        in key_to_id. This required a fully build key_to_id!
        Returns True, if something in the DB was changed.
        """
        key_to_id = key_to_id = cast(Dict[str, int], self.key_to_id)
        queryset = ConfigStore.objects.exclude(key__in=key_to_id.keys())
        altered_config = queryset.exists()
        queryset.delete()
        return altered_config

    def get_collection_string(self) -> str:
        """
        Returns the collection_string from the CollectionStore.
        """
        return ConfigStore.get_collection_string()

    def remove_group_id_from_all_group_configs(self, id: int) -> None:
        for config_variable in self.config_variables.values():
            if config_variable.input_type == "groups":
                value = self[config_variable.name]
                if isinstance(value, list) and id in value:
                    value = [x for x in value if x != id]
                    db_value = ConfigStore.objects.get(key=config_variable.name)
                    db_value.value = value
                    db_value.save()


config = ConfigHandler()
"""
Final entry point to get an set config variables. To get a config variable
use x = config[...], to set it use config[...] = x.
"""


T = TypeVar("T")
ChoiceType = Optional[Iterable[Dict[str, str]]]
ChoiceCallableType = Union[ChoiceType, Callable[[], ChoiceType]]
ValidatorsType = Iterable[Callable[[T], None]]
OnChangeType = Callable[[], None]
ConfigVariableDict = TypedDict(
    "ConfigVariableDict",
    {
        "defaultValue": Any,
        "inputType": str,
        "label": str,
        "helpText": str,
        "choices": ChoiceType,
        "weight": int,
        "group": str,
        "subgroup": Optional[str],
    },
)


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

    def __init__(
        self,
        name: str,
        default_value: T,
        input_type: str = "string",
        label: str = None,
        help_text: str = None,
        choices: ChoiceCallableType = None,
        hidden: bool = False,
        weight: int = 0,
        group: str = "General",
        subgroup: str = "General",
        validators: ValidatorsType = None,
        on_change: OnChangeType = None,
    ) -> None:
        if input_type not in INPUT_TYPE_MAPPING:
            raise ValueError("Invalid value for config attribute input_type.")
        if input_type == "choice" and choices is None:
            raise ConfigError(
                "Either config attribute 'choices' must not be None or "
                "'input_type' must not be 'choice'."
            )
        elif input_type != "choice" and choices is not None:
            raise ConfigError(
                "Either config attribute 'choices' must be None or "
                "'input_type' must be 'choice'."
            )
        self.name = name
        self.default_value = default_value
        self.input_type = input_type
        self.label = label or name
        self.help_text = help_text or ""
        self.choices = choices
        self.hidden = hidden
        self.weight = weight
        self.group = group
        self.subgroup = subgroup
        self.validators = validators or ()
        self.on_change = on_change

    @property
    def data(self) -> Optional[ConfigVariableDict]:
        """
        Property with all data for Angular variable on startup.
        """
        if self.hidden:
            return None

        return ConfigVariableDict(
            defaultValue=self.default_value,
            inputType=self.input_type,
            label=self.label,
            helpText=self.help_text,
            choices=self.choices() if callable(self.choices) else self.choices,
            weight=self.weight,
            group=self.group,
            subgroup=self.subgroup,
        )
