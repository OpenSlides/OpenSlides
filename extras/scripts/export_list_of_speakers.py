# -*- coding: utf-8 -*-

import sys
import csv
import argparse

# Import the openslide settings. Has has to be done before any other openslides
# import.
from openslides.main import get_user_config_path, setup_django_environment
setup_django_environment(
    get_user_config_path('openslides', 'settings.py'))

from openslides.agenda.models import Speaker


def parse_args():
    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument('-o', '--output', metavar= 'File', help='Save the output to FILE')
    return parser.parse_args()


def main():
    args = parse_args()

    if args.output is None:
        output = sys.stdout
    else:
        output = open(args.output, 'wb')

    csv_writer = csv.writer(output)
    csv_writer.writerow(['Item', 'Person-Name', 'Time'])
    for speaker in Speaker.objects.all().order_by('item', 'weight', 'time'):
        try:
            time = speaker.time.strftime('%d.%m.%Y %H:%M:%S')
        except AttributeError:
            time = None
        csv_writer.writerow([
            speaker.item.title, unicode(speaker.person).encode('utf8'), time])

if __name__ == "__main__":
    main()
