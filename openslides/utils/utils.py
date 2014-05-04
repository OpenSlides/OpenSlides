# -*- coding: utf-8 -*-

import difflib
import roman

from django.contrib.auth.models import Permission
from django.shortcuts import render_to_response
from django.template import RequestContext

from .signals import template_manipulation


def template(template_name):
    """
    Decorator to set a template for a view.

    Deprecated. Use class based views instead.
    """
    # TODO: Write the login page an the usersettings page with class based views
    #       Remove this function afterwards
    def renderer(func):
        def wrapper(request, *args, **kwargs):
            output = func(request, *args, **kwargs)
            if not isinstance(output, dict):
                return output
            context = {}
            template_manipulation.send(
                sender='utils_template', request=request, context=context)
            output.update(context)
            response = render_to_response(
                template_name, output, context_instance=RequestContext(request))
            if 'cookie' in output:
                response.set_cookie(output['cookie'][0], output['cookie'][1])
            return response
        return wrapper
    return renderer


def delete_default_permissions(**kwargs):
    """
    Deletes the permissions, django creates by default for the admin.
    """
    # TODO: Create an participant app which does not create the permissions.
    #       Delete this function afterwards
    for p in Permission.objects.all():
        if (p.codename.startswith('add') or
                p.codename.startswith('delete') or
                p.codename.startswith('change')):
            p.delete()


def html_strong(string):
    """
    Returns the text wrapped in an HTML-Strong element.
    """
    return u"<strong>%s</strong>" % string


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
