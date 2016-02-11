import roman


def to_roman(number):
    """
    Converts an arabic number within range from 1 to 4999 to the
    corresponding roman number. Returns None on error conditions.
    """
    try:
        return roman.toRoman(number)
    except (roman.NotIntegerError, roman.OutOfRangeError):
        return None
