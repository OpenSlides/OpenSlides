import difflib
import roman

from django.contrib.auth.models import Permission


def delete_default_permissions(**kwargs):
    """
    Deletes the permissions, django creates by default for the admin.
    """
    # TODO: Find a way not to create the permissions in the first place.
    #       Meta.default_permissions does not work, because django will
    #       nevertheless create permissions for its own models like "group"
    for p in Permission.objects.all():
        if (p.codename.startswith('add') or
                p.codename.startswith('delete') or
                p.codename.startswith('change')):
            p.delete()


def html_strong(string):
    """
    Returns the text wrapped in an HTML-Strong element.
    """
    return "<strong>%s</strong>" % string


def htmldiff(text1, text2):
    """
    Return string of html diff between two strings (text1 and text2)
    """
    diff = difflib.HtmlDiff(wrapcolumn=60)
    return diff.make_table(text1.splitlines(), text2.splitlines())


def int_or_none(var):
    """
    Trys to convert 'var' into an integer. Returns None if an TypeError occures.
    """
    try:
        return int(var)
    except (TypeError, ValueError):
        return None


def to_roman(number):
    """
    Converts an arabic number within range from 1 to 4999 to the corresponding roman number.
    Returns None on error conditions.
    """
    try:
        return roman.toRoman(number)
    except (roman.NotIntegerError, roman.OutOfRangeError):
        return None
