# -*- coding: utf-8 -*-

import csv
import re

from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.utils import csv_ext

from .models import Item


def import_agenda_items(csvfile):
    """
    Performs the import of agenda items form a csv file.
    """
    # Check encoding
    try:
        csvfile.read().decode('utf8')
    except UnicodeDecodeError:
        return_value = '', '', _('Import file has wrong character encoding, only UTF-8 is supported!')
    else:
        csvfile.seek(0)
        # Check dialect
        dialect = csv.Sniffer().sniff(csvfile.readline())
        dialect = csv_ext.patchup(dialect)
        csvfile.seek(0)
        # Parse CSV file
        with transaction.commit_on_success():
            success_lines = []
            error_lines = []
            for (line_no, line) in enumerate(csv.reader(csvfile, dialect=dialect)):
                if line_no == 0:
                    # Do not read the header line
                    continue
                # Check format
                try:
                    title, text, duration = line[:3]
                except ValueError:
                    error_lines.append(line_no + 1)
                    continue
                if duration and re.match('^(?:[0-9]{1,2}:[0-5][0-9]|[0-9]+)$', duration) is None:
                    error_lines.append(line_no + 1)
                    continue
                Item.objects.create(title=title, text=text, duration=duration)
                success_lines.append(line_no + 1)
            success = _('%d items successfully imported.') % len(success_lines)
            if error_lines:
                error = _('Error in the following lines: %s.') % ', '.join(str(number) for number in error_lines)
            else:
                error = ''
            return_value = success, '', error
    return return_value
