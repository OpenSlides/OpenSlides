# -*- coding: utf-8 -*-

# TODO: Rename the file to 'csv.py' when we drop python2 support. At the moment
#       the name csv has a conflict with the core-module. See:
#       http://docs.python.org/2/tutorial/modules.html#intra-package-references

import csv

from django.db import transaction
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_noop

from openslides.utils import csv_ext
from openslides.utils.person.api import Persons
from openslides.utils.utils import html_strong

from .models import Category, Motion


def import_motions(csvfile, default_submitter, override, importing_person=None):
    """
    Imports motions from a csv file.

    The file must be encoded in utf8. The first line (header) is ignored.
    If no or multiple submitters found, the default submitter is used. If
    a motion with a given identifier already exists, the motion is overridden,
    when the flag 'override' is True. If no or multiple categories found,
    the category is set to None.
    """
    count_success = 0
    count_lines = 0

    # Check encoding
    try:
        csvfile.read().decode('utf8')
    except UnicodeDecodeError:
        return '', '', _('Import file has wrong character encoding, only UTF-8 is supported!')
    csvfile.seek(0)

    with transaction.commit_on_success():
        dialect = csv.Sniffer().sniff(csvfile.readline())
        dialect = csv_ext.patchup(dialect)
        csvfile.seek(0)
        all_error_messages = []
        all_warning_messages = []
        for (line_no, line) in enumerate(csv.reader(csvfile, dialect=dialect)):
            warning = []
            if line_no < 1:
                # Do not read the header line
                continue
            importline = html_strong(_('Line %d:') % (line_no + 1))
            count_lines += 1
            # Check format
            try:
                (identifier, title, text, reason, submitter, category) = line[:6]
            except ValueError:
                msg = _('Line is malformed. Motion not imported. Please check the required values.')
                all_error_messages.append("%s %s" % (importline, msg))
                continue

            # Check existing motions according to the identifier
            if identifier:
                try:
                    motion = Motion.objects.get(identifier=identifier)
                except Motion.DoesNotExist:
                    motion = Motion(identifier=identifier)
                else:
                    if not override:
                        msg = _('Identifier already exists. Motion not imported.')
                        all_error_messages.append("%s %s" % (importline, msg))
                        continue
            else:
                motion = Motion()

            # Insert data
            motion.title = title
            motion.text = text
            motion.reason = reason
            if category:
                try:
                    category_object = Category.objects.get(name=category)
                except Category.DoesNotExist:
                    category_object = Category.objects.create(name=category, prefix=category[:1])
                    warning.append(_('Category unknown. New category created.'))
                except Category.MultipleObjectsReturned:
                    category_object = None
                    warning.append(_('Several suitable categories found. No category is used.'))
                motion.category = category_object
            motion.save()

            # Add submitter
            person_found = False
            if submitter:
                for person in Persons():
                    if person.clean_name == submitter.decode('utf8'):
                        if person_found:
                            warning.append(_('Several suitable submitters found.'))
                            person_found = False
                            break
                        else:
                            new_submitter = person
                            person_found = True
            if not person_found:
                warning.append(_('Submitter unknown. Default submitter is used.'))
                new_submitter = default_submitter

            # add all warnings of each csv line to one warning message
            if warning:
                warning_message_string = "%s " % importline
                warning_message_string += " ".join(warning)
                all_warning_messages.append(warning_message_string)

            motion.clear_submitters()
            motion.add_submitter(new_submitter)

            motion.write_log(message_list=[ugettext_noop('Motion imported')],
                             person=importing_person)
            count_success += 1

        # Build final error message with all error items (one bullet point for each csv line)
        full_error_message = ''
        if all_error_messages:
            full_error_message = "%s <ul>" % html_strong(_("Errors"))
            for error in all_error_messages:
                full_error_message += "<li>%s</li>" % error
            full_error_message += "</ul>"

        # Build final warning message with all warning items (one bullet point for each csv line)
        full_warning_message = ''
        if all_warning_messages:
            full_warning_message = "%s <ul>" % html_strong(_("Warnings"))
            for warning in all_warning_messages:
                full_warning_message += "<li>%s</li>" % warning
            full_warning_message += "</ul>"

        # Build final success message
        if count_success:
            success_message = '<strong>%s</strong><br>%s' % (
                _('Summary'),
                _('%(counts)d of %(total)d motions successfully imported.')
                % {'counts': count_success, 'total': count_lines})
        else:
            success_message = ''

    return success_message, full_warning_message, full_error_message
