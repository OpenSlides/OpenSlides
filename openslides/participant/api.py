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
    Generates a random passwort.
    """
    chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    size = 8

    return ''.join([choice(chars) for i in range(size)])


def gen_username(first_name, last_name):
    """
    Generates a username from a first- and lastname.
    """
    first_name = first_name.strip()
    last_name = last_name.strip()

    if first_name and last_name:
        base_name = " ".join((first_name, last_name))
    else:
        base_name = first_name or last_name
        if not base_name:
            raise ValueError('Either \'first_name\' or \'last_name\' can not be '
                             'empty')

    if not User.objects.filter(username=base_name).exists():
        return base_name

    counter = 0
    while True:
        counter += 1
        test_name = "%s %d" % (base_name, counter)
        if not User.objects.filter(username=test_name).exists():
            return test_name


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
                        (title, first_name, last_name, gender, email, groups,
                         structure_level, committee, about_me, comment, is_active) = line[:11]
                    except ValueError:
                        error_messages.append(_('Ignoring malformed line %d in import file.') % (line_no + 1))
                        continue
                    user = User()
                    user.title = title
                    user.last_name = last_name
                    user.first_name = first_name
                    user.username = gen_username(first_name, last_name)
                    user.gender = gender
                    user.email = email
                    user.structure_level = structure_level
                    user.committee = committee
                    user.about_me = about_me
                    user.comment = comment
                    if is_active == '1':
                        user.is_active = True
                    else:
                        user.is_active = False
                    user.default_password = gen_password()
                    user.save()
                    for groupid in groups:
                        try:
                            if groupid != ",":
                                Group.objects.get(pk=groupid).user_set.add(user)
                        except ValueError:
                            error_messages.append(_('Ignoring malformed group id in line %d.') % (line_no + 1))
                            continue
                        except Group.DoesNotExist:
                            error_messages.append(_('Group id %(id)s does not exists (line %(line)d).') % {'id': groupid, 'line': line_no + 1})
                            continue
                    user.reset_password()
                    count_success += 1
    except csv.Error:
        error_messages.append(_('Import aborted because of severe errors in the input file.'))
    except UnicodeDecodeError:
        error_messages.append(_('Import file has wrong character encoding, only UTF-8 is supported!'))
    return (count_success, error_messages)


def get_registered_group():
    """
    Returns the group 'Registered' (pk=2).
    """
    return Group.objects.get(pk=2)


def create_or_reset_admin_user():
    group_staff = Group.objects.get(pk=4)
    try:
        admin = User.objects.get(username="admin")
    except User.DoesNotExist:
        admin = User()
        admin.username = 'admin'
        admin.last_name = 'Administrator'

    admin.default_password = 'admin'
    admin.set_password(admin.default_password)
    admin.save()
    admin.groups.add(group_staff)
