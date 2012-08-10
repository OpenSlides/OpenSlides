#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.api
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

# for python 2.5 support
from __future__ import with_statement

from random import choice
import string
import csv

from django.contrib.auth.models import User
from django.db import transaction

from openslides.utils import csv_ext
from openslides.utils.person import get_person

from openslides.participant.models import OpenSlidesUser


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

def import_users(csv_file):
    error_messages = []
    count_success = 0
    try:
        # check for valid encoding (will raise UnicodeDecodeError if not)
        csv_file.read().decode('utf-8')
        csv_file.seek(0)

        with transaction.commit_on_success():
            dialect = csv.Sniffer().sniff(csv_file.readline())
            dialect = csv_ext.patchup(dialect)
            csv_file.seek(0)

            for (line_no, line) in enumerate(csv.reader(csv_file, dialect=dialect)):
                if line_no:
                    try:
                        (first_name, last_name, gender, category, type, committee, comment) = line[:7]
                    except ValueError:
                        error_messages.append(_('Ignoring malformed line %d in import file.') % line_no + 1)
                        continue
                    user = OpenSlidesUser()
                    user.last_name = last_name
                    user.first_name = first_name
                    user.username = gen_username(first_name, last_name)
                    user.gender = gender
                    user.category = category
                    user.type = type
                    user.committee = committee
                    user.comment = comment
                    user.firstpassword = gen_password()
                    user.save()
                    user.reset_password()
                    count_success += 1
    except csv.Error:
        error_messages.appen(_('Import aborted because of severe errors in the input file.'))
    except UnicodeDecodeError:
        error_messages.appen(_('Import file has wrong character encoding, only UTF-8 is supported!'))
    return (count_success, error_messages)
