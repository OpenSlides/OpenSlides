# -*- coding: utf-8 -*-

import csv

from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.utils import csv_ext
from openslides.utils.utils import html_strong

from .api import gen_password, gen_username
from .models import Group, User


def import_users(csvfile):
    error_messages = []
    count_success = 0
    try:
        # check for valid encoding (will raise UnicodeDecodeError if not)
        csvfile.read().decode('utf-8')
        csvfile.seek(0)

        with transaction.commit_on_success():
            dialect = csv.Sniffer().sniff(csvfile.readline())
            dialect = csv_ext.patchup(dialect)
            csvfile.seek(0)

            for (line_no, line) in enumerate(csv.reader(csvfile,
                                                        dialect=dialect)):
                if line_no:
                    try:
                        (title, first_name, last_name, gender, email, groups,
                         structure_level, committee, about_me, comment, is_active) = line[:11]
                    except ValueError:
                        error_messages.append(_('Ignoring malformed line %d in import file.') % (line_no + 1))
                        continue
                    if not first_name and not last_name:
                        error_messages.append(_("In line %d you have to provide either 'first_name' or 'last_name'.") % (line_no + 1))
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
                    for groupid in groups.split(','):
                        try:
                            if groupid and int(groupid):
                                Group.objects.get(pk=groupid).user_set.add(user)
                        except (Group.DoesNotExist, ValueError):
                            error_messages.append(_('Ignoring group id "%(id)s" in line %(line)d which does not exist.') %
                                                  {'id': groupid, 'line': line_no + 1})
                            continue
                    user.reset_password()
                    count_success += 1
    except csv.Error:
        error_messages.append(_('Import aborted because of severe errors in the input file.'))
    except UnicodeDecodeError:
        error_messages.append(_('Import file has wrong character encoding, only UTF-8 is supported!'))

    # Build final success message
    if count_success:
        success_message = _('%d new participants were successfully imported.') % count_success
    else:
        success_message = ''

    # Build final error message with all error items (one bullet point for each csv line)
    full_error_message = ''
    if error_messages:
        full_error_message = "%s <ul>" % html_strong(_("Errors"))
        for error in error_messages:
            full_error_message += "<li>%s</li>" % error
        full_error_message += "</ul>"

    return success_message, '', full_error_message
