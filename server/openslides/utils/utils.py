import random
import re
import string
from typing import Any, Dict, Generator, Optional, Tuple, Type, Union

import roman
from django.apps import apps
from django.db.models import Model


CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_1 = re.compile("(.)([A-Z][a-z]+)")
CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_2 = re.compile("([a-z0-9])([A-Z])")


def convert_camel_case_to_pseudo_snake_case(text: str) -> str:
    """
    Converts camel case to pseudo snake case using hyphen instead of
    underscore.

    E. g. ThisText is converted to this-text.

    Credits: epost (http://stackoverflow.com/a/1176023)
    """
    s1 = CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_1.sub(r"\1-\2", text)
    return CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_2.sub(r"\1-\2", s1).lower()


def to_roman(number: int) -> str:
    """
    Converts an arabic number within range from 1 to 4999 to the
    corresponding roman number. Returns the input converted as string on error
    conditions or higher numbers.
    """
    try:
        return roman.toRoman(number)
    except (roman.NotIntegerError, roman.OutOfRangeError):
        return str(number)


def get_element_id(collection_string: str, id: int) -> str:
    """
    Returns a combined string from the collection_string and an id.
    """
    return f"{collection_string}:{id}"


def split_element_id(element_id: Union[str, bytes]) -> Tuple[str, int]:
    """
    Splits a combined element_id into the collection_string and the id.
    """
    if isinstance(element_id, bytes):
        element_id = element_id.decode()
    collection_str, id = element_id.rsplit(":", 1)
    return (collection_str, int(id))


def str_dict_to_bytes(str_dict: Dict[str, str]) -> Dict[bytes, bytes]:
    """
    Converts the key and the value of a dict from str to bytes.
    """
    out = {}
    for key, value in str_dict.items():
        out[key.encode()] = value.encode()
    return out


def is_int(obj: Any) -> bool:
    try:
        int(obj)
        return True
    except (ValueError, TypeError):
        return False


def is_iterable(obj: Any) -> bool:
    """
    Do not rely on `isinstance(obj, Iterable` with `Iterable` being imperted
    from typing. This breaks at proxyobjects, like SimpleLazyObjects from Django.
    Instead try to get the iterable from the object. THis fails on non-iterable
    proxyobjects.
    """
    try:
        iter(obj)
        return True
    except TypeError:
        return False


_models_to_collection_string: Dict[str, Type[Model]] = {}


def get_model_from_collection_string(collection_string: str) -> Type[Model]:
    """
    Returns a model class which belongs to the argument collection_string.
    """

    def model_generator() -> Generator[Type[Model], None, None]:
        """
        Yields all models of all apps.
        """
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                yield model

    # On the first run, generate the dict. It can not change at runtime.
    if not _models_to_collection_string:
        for model in model_generator():
            try:
                get_collection_string = model.get_collection_string
            except AttributeError:
                # Skip models which do not have the method get_collection_string.
                pass
            else:
                _models_to_collection_string[get_collection_string()] = model
    try:
        model = _models_to_collection_string[collection_string]
    except KeyError:
        raise ValueError(
            f"Invalid message. A valid collection_string is missing. Got {collection_string}"
        )
    return model


_worker_id: Optional[str] = None
"""
The worker id. Accessable via `get_worker_id()`.
"""


def get_worker_id() -> str:
    """
    Returns a random string of length 4 that identifies this
    instance of this worker
    """
    global _worker_id
    if _worker_id is None:
        _worker_id = "".join(random.sample(string.ascii_letters, 4))
    return _worker_id
