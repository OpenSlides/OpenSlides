#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.api
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from random import choice
import string

from django.contrib.auth.models import User

from openslides.utils.user import get_user
from openslides.participant.models import Profile


def gen_password():
    """
    generates a random passwort.
    """
    chars = string.letters + string.digits
    newpassword = ''
    for i in range(8):
        newpassword += choice(chars)
    return newpassword


def gen_username(first_name, last_name):
    """
    generates the username for new users.
    """
    testname = "%s %s" % (first_name.strip(), last_name.strip())
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


def user2djangouser(user):
    u = get_user('djangouser:%d' % user.id)
    try:
        return u.profile
    except Profile.DoesNotExist:
        return u
