#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.urls
    ~~~~~~~~~~~~~~~~~~~~~

    URL functions for OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import sys
import json

from django.contrib import messages
from django.contrib.auth.models import Permission
from django.core.context_processors import csrf
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.template.loader import render_to_string
from django.utils.translation import ugettext as _, ugettext_lazy

from openslides.utils.signals import template_manipulation


def gen_confirm_form(request, message, url):
    """
    Generate a message-form.

    Deprecated. Use Class base Views instead.
    """
    messages.warning(
        request,
        """
        %s
        <form action="%s" method="post">
            <input type="hidden" value="%s" name="csrfmiddlewaretoken">
            <button type="submit" name="submit" class="btn btn-mini">%s</button>
            <button name="cancel" class="btn btn-mini">%s</button>
        </form>
        """
        % (message, url, csrf(request)['csrf_token'], _("Yes"), _("No")))


def del_confirm_form(request, object, name=None, delete_link=None):
    """
    Creates a question to delete an object.

    Deprecated. Use Class base Views instead.
    """
    if name is None:
        name = object
    if delete_link is None:
        delete_link = object.get_absolute_url('delete')
    gen_confirm_form(
        request, _('Do you really want to delete %s?')
        % html_strong(name), delete_link)


def template(template_name):
    """
    Decorator to set a template for a view.

    Deprecated. Use class based views instead.
    """
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


def permission_required(perm, login_url=None):
    """
    Decorator for views that checks whether a user has a particular permission
    enabled, redirecting to the log-in page if necessary.

    Deprecated.
    """
    def renderer(func):
        def wrapper(request, *args, **kw):
            if request.user.has_perm(perm):
                return func(request, *args, **kw)
            if request.user.is_authenticated():
                return render_to_forbidden(request)
            return redirect(reverse('user_login'))
        return wrapper
    return renderer


def render_to_forbidden(request,
                        error=ugettext_lazy("Sorry, you have no rights to see this page.")):
    # TODO: Integrate this function into the PermissionMixin once the
    # above function is deleted.
    return HttpResponseForbidden(render_to_string(
        '403.html', {'error': error}, context_instance=RequestContext(request)))


def delete_default_permissions(**kwargs):
    """
    Deletes the permissions, django creates by default for the admin.
    """
    for p in Permission.objects.all():
        if (p.codename.startswith('add') or
                p.codename.startswith('delete') or
                p.codename.startswith('change')):
            p.delete()


def ajax_request(data):
    """
    generates a HTTPResponse-Object with json-Data for a
    ajax response.

    Deprecated.
    """
    return HttpResponse(json.dumps(data))


def _propper_unicode(text):
    if not isinstance(text, unicode):
        return u"%s" % text.decode('UTF-8')
    else:
        return text


def decodedict(dict):
    newdict = {}
    for key in dict:
        newdict[key] = [dict[key][0].encode('utf-8')]
    return newdict


def encodedict(dict):
    newdict = {}
    for key in dict:
        newdict[key] = [unicode(dict[key][0].decode('utf-8'))]
    return newdict


def html_strong(string):
    return u"<strong>%s</strong>" % string
