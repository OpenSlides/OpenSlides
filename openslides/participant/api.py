#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.api
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the participant app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib.auth.models import User, get_hexdigest
from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.utils.translation import ugettext as _

class ChangePasswordMiddleware(object):
    def process_request(self, request):
        if request.user.is_authenticated() and "password_checked" not in request.session:
            algo, salt, hsh = request.user.password.split('$')
            bad_password = get_hexdigest(algo, salt, "%s%s" % (request.user.first_name, request.user.last_name))
            if hsh == bad_password:
                messages.info(request, _('You have to change your Password.'))
                if request.path_info != '/user/settings' and 'static' not in request.path_info:
                    return redirect(reverse('user_settings'))
            else:
                request.session["password_checked"] = True


def gen_username(first_name, last_name):
    testname = "%s%s" % (first_name, last_name)
    try:
        User.objects.get(username=testname)
    except User.DoesNotExist:
        return testname
    i = 0
    while True:
        i += 1
        testname = "%s%s%s" % (first_name, last_name, i)
        try:
            User.objects.get(username=testname)
        except User.DoesNotExist:
            return testname
