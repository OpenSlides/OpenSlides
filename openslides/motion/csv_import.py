#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.csv_import
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Functions to import motions from a csv file.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

# TODO: Rename the file to 'csv.py' when we drop python2 support. At the moment
#       the name csv has a conflict with the core-module. See:
#       http://docs.python.org/2/tutorial/modules.html#intra-package-references

import csv

from django.db import transaction
from django.utils.translation import ugettext as _, ugettext_noop

from openslides.utils import csv_ext
from openslides.utils.person.api import Persons
from openslides.utils.utils import html_strong

from .models import Motion, Category


def import_motions(csv_file, default_submitter, override=False, importing_person=None):
    """
    Imports motions from a csv file.

    The file must be encoded in utf8. The first line (header) is ignored.
    If no or multiple submitters found, the default submitter is used. If
    a motion with a given identifier already exists, the motion is overridden,
    when the flag 'override' is true. If no or multiple categories found,
    the category is set to None.
    """
    error_messages = []
    warning_messages = []
    count_success = 0
    count_lines = 0

    # Check encoding
    try:
        csv_file.read().decode('utf8')
    except UnicodeDecodeError:
        return (0, [_('Import file has wrong character encoding, only UTF-8 is supported!')], [])
    csv_file.seek(0)

    with transaction.commit_on_success():
        dialect = csv.Sniffer().sniff(csv_file.readline())
        dialect = csv_ext.patchup(dialect)
        csv_file.seek(0)
        for (line_no, line) in enumerate(csv.reader(csv_file, dialect=dialect)):
            warnings = []
            if line_no < 1:
                # Do not read the header line
                continue

            count_lines += 1
            # Check format
            try:
                (identifier, title, text, reason, submitter, category) = line[:6]
            except ValueError:
                error_line = html_strong(_('Line %d of import file:') % (line_no + 1))
                msg = _('Line is malformed. Motion not imported. Please check the required values.')
                error_messages.append("%s<br>%s" % (error_line, msg))
                continue

            # Check existing motions according to the identifier
            if identifier:
                try:
                    motion = Motion.objects.get(identifier=identifier)
                except Motion.DoesNotExist:
                    motion = Motion(identifier=identifier)
                else:
                    if not override:
                        error_line = html_strong(_('Line %d of import file:') % (line_no + 1))
                        msg = _('Identifier already exists. Motion not imported.')
                        error_messages.append("%s<br>%s" % (error_line, msg))
                        continue
            else:
                motion = Motion()

            # Insert data
            motion.title = title
            motion.text = text
            motion.reason = reason
            if category:
                try:
                    motion.category = Category.objects.get(name=category)
                except Category.DoesNotExist:
                    warnings.append(_('Category unknown. No category is used.'))
                except Category.MultipleObjectsReturned:
                    warnings.append(_('Several suitable categories found. No category is used.'))
            motion.save()

            # Add submitter
            person_found = False
            if submitter:
                for person in Persons():
                    if person.clean_name == submitter.decode('utf8'):
                        if person_found:
                            warnings.append(_('Several suitable submitters found.'))
                            person_found = False
                            break
                        else:
                            new_submitter = person
                            person_found = True
            if not person_found:
                warnings.append(_('Submitter unknown. Default submitter is used.'))
                new_submitter = default_submitter

            # show summarized warning message for each import line
            if warnings:
                warning_line = _('Line %d of import file:') % (line_no + 1)
                warning_message_string = "%s<ul>" % html_strong(warning_line)
                for w in warnings:
                    warning_message_string += "<li>%s</li>" % w
                warning_message_string += "</ul>"
                warning_messages.append(warning_message_string)
            motion.clear_submitters()
            motion.add_submitter(new_submitter)

            motion.write_log(message_list=[ugettext_noop('Motion imported')],
                             person=importing_person)
            count_success += 1

    return (count_success, count_lines, error_messages, warning_messages)
