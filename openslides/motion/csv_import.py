#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.csv_import
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Functions to import motions from csv.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

# TODO: Rename the file to 'csv.py' when we drop python2 support. At the moment
#       the name csv has a conflict with the core-module. See:
#       http://docs.python.org/2/tutorial/modules.html#intra-package-references

import csv
from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.utils import csv_ext
from .models import Motion


def import_motions(csv_file):
    error_messages = []
    count_success = 0
    csv_file.read().decode('utf-8')
    csv_file.seek(0)
    with transaction.commit_on_success():
        for (line_no, line) in enumerate(csv.reader(csv_file)):
            if line_no < 1:
                # Do not read the header line
                continue

            # TODO: test for wrong format
            try:
                (identifier, title, text, reason, person_id) = line[:5]
            except ValueError:
                error_messages.append(_('Ignoring malformed line %d in import file.') % (line_no + 1))
                continue

            if identifier:
                try:
                    motion = Motion.objects.get(identifier=identifier)
                except Motion.DoesNotExist:
                    motion = Motion()
            else:
                motion = Motion()

            motion.title = title
            motion.text = text
            motion.reason = reason
            motion.save()
            # TODO: person does not exist
            motion.add_submitter(person_id)
            count_success += 1
    return (count_success, error_messages)
