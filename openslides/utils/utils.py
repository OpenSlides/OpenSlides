import re

import roman

CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_1 = re.compile('(.)([A-Z][a-z]+)')
CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_2 = re.compile('([a-z0-9])([A-Z])')


def convert_camel_case_to_pseudo_snake_case(text):
    """
    Converts camel case to pseudo snake case using hyphen instead of
    underscore.

    E. g. ThisText is converted to this-text.

    Credits: epost (http://stackoverflow.com/a/1176023)
    """
    s1 = CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_1.sub(r'\1-\2', text)
    return CAMEL_CASE_TO_PSEUDO_SNAKE_CASE_CONVERSION_REGEX_2.sub(r'\1-\2', s1).lower()


def to_roman(number):
    """
    Converts an arabic number within range from 1 to 4999 to the
    corresponding roman number. Returns None on error conditions.
    """
    try:
        return roman.toRoman(number)
    except (roman.NotIntegerError, roman.OutOfRangeError):
        return None
