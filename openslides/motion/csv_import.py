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

from openslides.utils.person.api import Persons

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

    # Check encoding
    try:
        csv_file.read().decode('utf8')
    except UnicodeDecodeError:
        return (0, [_('Encoding error in import file. Ensure using UTF-8.')], [])
    csv_file.seek(0)

    with transaction.commit_on_success():
        for (line_no, line) in enumerate(csv.reader(csv_file)):
            if line_no < 1:
                # Do not read the header line
                continue

            # Check format
            try:
                (identifier, title, text, reason, submitter, category) = line[:6]
            except ValueError:
                error_messages.append(_('Ignoring malformed line %d in import file.') % (line_no + 1))
                continue

            # Check existing motions according to the identifier
            if identifier:
                try:
                    motion = Motion.objects.get(identifier=identifier)
                except Motion.DoesNotExist:
                    motion = Motion(identifier=identifier)
                else:
                    if not override:
                        error_messages.append(_('Line %d in import file: Ignoring existing motion.') % (line_no + 1))
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
                    error_messages.append(_('Line %d in import file: Category not found.') % (line_no + 1))
                except Category.MultipleObjectsReturned:
                    error_messages.append(_('Line %d in import file: Multiple categories found.') % (line_no + 1))
            motion.save()

            # Add submitter
            person_found = False
            if submitter:
                for person in Persons():
                    if person.clean_name == submitter.decode('utf8'):
                        if person_found:
                            error_messages.append(_('Line %d in import file: Multiple persons found.') % (line_no + 1))
                            person_found = False
                            break
                        else:
                            new_submitter = person
                            person_found = True
            if not person_found:
                warning_messages.append(_('Line %d in import file: Default submitter is used.') % (line_no + 1))
                new_submitter = default_submitter
            motion.clear_submitters()
            motion.add_submitter(new_submitter)

            motion.write_log(message_list=[ugettext_noop('Motion imported')],
                             person=importing_person)
            count_success += 1

    return (count_success, error_messages, warning_messages)
