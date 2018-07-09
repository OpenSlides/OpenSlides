import re
from typing import TYPE_CHECKING, Dict, Optional, Tuple, Union

import roman


if TYPE_CHECKING:
    # Dummy import Collection for mypy, can be fixed with python 3.7
    from .collection import Collection, CollectionElement  # noqa

CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_1 = re.compile('(.)([A-Z][a-z]+)')
CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_2 = re.compile('([a-z0-9])([A-Z])')


def convert_camel_case_to_pseudo_snake_case(text: str) -> str:
    """
    Converts camel case to pseudo snake case using hyphen instead of
    underscore.

    E. g. ThisText is converted to this-text.

    Credits: epost (http://stackoverflow.com/a/1176023)
    """
    s1 = CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_1.sub(r'\1-\2', text)
    return CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_2.sub(r'\1-\2', s1).lower()


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
    return "{}:{}".format(collection_string, id)


def split_element_id(element_id: Union[str, bytes]) -> Tuple[str, int]:
    """
    Splits a combined element_id into the collection_string and the id.
    """
    if isinstance(element_id, bytes):
        element_id = element_id.decode()
    collection_str, id = element_id.rsplit(":", 1)
    return (collection_str, int(id))


def get_user_id(user: Optional['CollectionElement']) -> int:
    """
    Returns the user id for an CollectionElement user.

    Returns 0 for anonymous.
    """
    if user is None:
        user_id = 0
    else:
        user_id = user.id
    return user_id


def str_dict_to_bytes(str_dict: Dict[str, str]) -> Dict[bytes, bytes]:
    """
    Converts the key and the value of a dict from str to bytes.
    """
    out = {}
    for key, value in str_dict.items():
        out[key.encode()] = value.encode()
    return out
