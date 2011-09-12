#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.urls
    ~~~~~~~~~~~~~~~~~~~~~

    URL list for utils.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

try:
    import json
except ImportError:
    import simplejson as json

from django.shortcuts import render_to_response, redirect
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseForbidden
from django.template import RequestContext
from django.template.loader import render_to_string
from django.core.context_processors import csrf
from django.contrib import messages
from django.contrib.auth.models import Permission
from django.utils.translation import ugettext as _

from openslides import OPENSLIDES_REVISION

def revision(request):
    return {'OPENSLIDES_REVISION': OPENSLIDES_REVISION}


def gen_confirm_form(request, message, url):
    messages.warning(request, '%s<form action="%s" method="post"><input type="hidden" value="%s" name="csrfmiddlewaretoken"><input type="submit" value="%s" /> <input type="button" value="%s"></form>' % (message, url, csrf(request)['csrf_token'], _("Yes"), _("No")))

def del_confirm_form(request, object, name=None):
    if name is None:
        name = object
    gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % name, object.get_absolute_url('delete'))

def render_response(req, *args, **kwargs):
    kwargs['context_instance'] = RequestContext(req)
    return render_to_response(*args, **kwargs)

def template(template_name):
    def renderer(func):
        def wrapper(request, *args, **kw):
            output = func(request, *args, **kw)
            if not isinstance(output, dict):
                return output
            response = render_to_response(template_name, output, context_instance=RequestContext(request))
            if 'cookie' in output:
                response.set_cookie(output['cookie'][0], output['cookie'][1])
            return response
        return wrapper
    return renderer


def permission_required(perm, login_url=None):
    """
    Decorator for views that checks whether a user has a particular permission
    enabled, redirecting to the log-in page if necessary.
    """
    def renderer(func):
        def wrapper(request, *args, **kw):
            if request.user.has_perm(perm):
                return func(request, *args, **kw)
            if request.user.is_authenticated():
                return render_to_forbitten(request)
            return redirect(reverse('user_login'))
        return wrapper
    return renderer

def render_to_forbitten(request, error=_("Sorry, you have no rights to see this page.")):
    return HttpResponseForbidden(render_to_string('403.html', {'error': error}, context_instance=RequestContext(request)))

def delete_default_permissions():
    for p in Permission.objects.all():
        if p.codename.startswith('add') or p.codename.startswith('delete') or p.codename.startswith('change'):
            p.delete()

def ajax_request(data):
    """
    generates a HTTPResponse-Object with json-Data for a
    ajax response
    """
    return HttpResponse(json.dumps(data))
