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


def to_roman(number):
    """
    Converts an arabic number within range from 1 to 4999 to the corresponding roman number.
    Returns None on error conditions.
    """
    try:
        return roman.toRoman(number)
    except (roman.NotIntegerError, roman.OutOfRangeError):
        return None
