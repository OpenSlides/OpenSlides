#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.api
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the participant app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from random import choice
import csv

from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.utils import csv_ext

from openslides.participant.models import User, Group


def gen_password():
    """
    generates a random passwort.
    """
    chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    size = 8

    return ''.join([choice(chars) for i in range(size)])


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
        testname = "%s %s %s" % (first_name, last_name, i)
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

            for (line_no, line) in enumerate(csv.reader(csv_file,
                                                        dialect=dialect)):
                if line_no:
                    try:
                        (first_name, last_name, gender, structure_level, type, committee, comment) = line[:7]
                    except ValueError:
                        error_messages.append(_('Ignoring malformed line %d in import file.') % (line_no + 1))
                        continue
                    user = User()
                    user.last_name = last_name
                    user.first_name = first_name
                    user.username = gen_username(first_name, last_name)
                    user.gender = gender
                    user.structure_level = structure_level
                    user.type = type
                    user.committee = committee
                    user.comment = comment
                    user.default_password = gen_password()
                    user.save()
                    user.reset_password()
                    count_success += 1
    except csv.Error:
        error_messages.appen(_('Import aborted because of severe errors in the input file.'))
    except UnicodeDecodeError:
        error_messages.appen(_('Import file has wrong character encoding, only UTF-8 is supported!'))
    return (count_success, error_messages)


def get_registered_group():
    """
    Returns the Group 'Registered'. Upper and lower case is possible.
    """
    return Group.objects.get(name__iexact='Registered')
