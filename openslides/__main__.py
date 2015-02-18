#!/usr/bin/env python

import os
import sys

from django.core.management import execute_from_command_line

from openslides import __version__ as openslides_version
from openslides.utils.main import (
    get_default_settings_path,
    setup_django_settings_module,
    write_settings,
    UnknownCommand,
    ExceptionArgumentParser,
    get_development_settings_path,
    start_browser,
    is_development)


def main():
    """
    Main entrance to OpenSlides.
    """
    parser = get_parser()
    try:
        known_args, unknown_args = parser.parse_known_args()
    except UnknownCommand:
        unknown_command = True
    else:
        unknown_command = False

    if unknown_command:
        # Run a command, that is defined by the django management api
        development = is_development()
        setup_django_settings_module(development=development)
        execute_from_command_line(sys.argv)
    else:
        # Run a command that is defined here
        # These are commands that can not rely on an existing settings
        known_args.callback(known_args)


def get_parser():
    """
    Parses all command line arguments.
    """
    if len(sys.argv) == 1 and not is_development():
        sys.argv.append('start')

    # Init parser
    description = 'Start script for OpenSlides.'
    if 'manage.py' not in sys.argv[0]:
        description += (' If it is called without any argument, this will be '
                        'treated as if it is called with the "start" subcommand. '
                        'That means OpenSlides will setup default settings and '
                        'database, start the tornado webserver, launch the '
                        'default web browser and open the webinterface.')
    parser = ExceptionArgumentParser(description=description)

    # Add version argument
    parser.add_argument(
        '--version',
        action='version',
        version=openslides_version,
        help='Show version number and exit.')

    # Init subparsers
    subparsers = parser.add_subparsers(
        dest='subcommand',
        title='Available subcommands',
        description="Type '%s <subcommand> --help' for help on a "
                    "specific subcommand." % parser.prog,
        help='You can choose only one subcommand at once.')

    # Subcommand start
    subcommand_start = subparsers.add_parser(
        'start',
        help='Setup settings and database, start tornado webserver, launch the '
             'default web browser and open the webinterface. The environment '
             'variable DJANGO_SETTINGS_MODULE is ignored.')
    subcommand_start.add_argument(
        '--no-browser',
        action='store_true',
        help='Do not launch the default web browser.')
    subcommand_start.add_argument(
        '--settings_path',
        action='store',
        default=None,
        help='The used settings file. The file is created, if it does not exist.')
    subcommand_start.set_defaults(callback=start)
    subcommand_start.add_argument(
        '--development',
        action='store_true',
        help='Command for development purposes.')

    # Subcommand createsettings
    subcommand_createsettings = subparsers.add_parser(
        'createsettings',
        help='Create the settings file.')
    subcommand_createsettings.set_defaults(callback=createsettings)
    subcommand_createsettings.add_argument(
        '--settings_path',
        action='store',
        default=None,
        help='The used settings file. The file is created, even if it exists.')
    subcommand_createsettings.add_argument(
        '--development',
        action='store_true',
        help='Command for development purposes.')

    return parser


def start(args):
    """
    Starts OpenSlides: Runs migrations and runs runserver.
    """
    settings_path = args.settings_path
    development = is_development()

    if settings_path is None:
        if development:
            settings_path = get_development_settings_path()
        else:
            settings_path = get_default_settings_path()

    # Write settings if it does not exists.
    if not os.path.isfile(settings_path):
        createsettings(args)

    # Set the django setting module and run migrations
    # A manual given environment variable will be overwritten
    setup_django_settings_module(settings_path, development=development)

    execute_from_command_line(['manage.py', 'migrate'])

    if not args.no_browser:
        start_browser('http://0.0.0.0:8000')

    # Start the webserver
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])


def createsettings(args):
    """
    Creates settings for OpenSlides.
    """
    settings_path = args.settings_path
    development = is_development()
    context = {}

    if development:
        if settings_path is None:
            settings_path = get_development_settings_path()
        context = {
            'openslides_user_data_path': repr(os.path.join(os.getcwd(), 'development')),
            'debug': 'True'}

    settings_path = write_settings(settings_path, **context)
    print('Settings created at %s' % settings_path)


if __name__ == "__main__":
    exit(main())
