#!/usr/bin/env python

import os
import sys

from django.core.management import execute_from_command_line

from openslides import __version__ as openslides_version
from openslides.utils.main import (
    ExceptionArgumentParser,
    UnknownCommand,
    get_default_settings_path,
    get_local_settings_path,
    is_local_installation,
    setup_django_settings_module,
    start_browser,
    write_settings,
)


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
        local_installation = is_local_installation()
        setup_django_settings_module(local_installation=local_installation)
        execute_from_command_line(sys.argv)
    else:
        # Run a command that is defined here
        # These are commands that can not rely on an existing settings
        known_args.callback(known_args)


def get_parser():
    """
    Parses all command line arguments.
    """
    if len(sys.argv) == 1 and not is_local_installation():
        sys.argv.append('start')

    # Init parser
    description = 'Start script for OpenSlides.'
    if 'manage.py' not in sys.argv[0]:
        description += """
            If it is called without any argument, this will be treated as
            if it is called with the 'start' subcommand. That means
            OpenSlides will setup default settings and database, start the
            tornado webserver, launch the default web browser and open the
            webinterface.
            """
    epilog = """
        There are some more subcommands available. They belong to Django's
        command-line utility for administrative tasks. Type '%(prog)s help'
        (without the two hyphen-minus characters) to list them all. Type
        '%(prog)s help <subcommand>' for help on a specific subcommand.
        """
    parser = ExceptionArgumentParser(
        description=description,
        epilog=epilog)

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
        help='You can choose only one subcommand at once.',
        metavar='')

    # Subcommand start
    start_help = (
        'Setup settings and database, start tornado webserver, launch the '
        'default web browser and open the webinterface. The environment '
        'variable DJANGO_SETTINGS_MODULE is ignored.')
    subcommand_start = subparsers.add_parser(
        'start',
        description=start_help,
        help=start_help)
    subcommand_start.add_argument(
        '--no-browser',
        action='store_true',
        help='Do not launch the default web browser.')
    subcommand_start.add_argument(
        '--host',
        action='store',
        default='0.0.0.0',
        help='IP address to listen on. Default is 0.0.0.0.')
    subcommand_start.add_argument(
        '--port',
        action='store',
        default='8000',
        help='Port to listen on. Default is 8000.')
    subcommand_start.add_argument(
        '--settings_path',
        action='store',
        default=None,
        help='The used settings file. The file is created, if it does not exist.')
    subcommand_start.set_defaults(callback=start)
    subcommand_start.add_argument(
        '--local-installation',
        action='store_true',
        help='Store settings and user files in a local directory.')

    # Subcommand createsettings
    createsettings_help = 'Creates the settings file.'
    subcommand_createsettings = subparsers.add_parser(
        'createsettings',
        description=createsettings_help,
        help=createsettings_help)
    subcommand_createsettings.set_defaults(callback=createsettings)
    subcommand_createsettings.add_argument(
        '--settings_path',
        action='store',
        default=None,
        help='The used settings file. The file is created, even if it exists.')
    subcommand_createsettings.add_argument(
        '--local-installation',
        action='store_true',
        help='Store settings and user files in a local directory.')

    # Help text for several Django subcommands
    django_subcommands = (
        ('backupdb', 'Backups the SQLite3 database.'),
        ('createsuperuser', 'Creates or resets the admin user.'),
        ('migrate', 'Updates database schema.'),
        ('runserver', 'Starts the Tornado webserver.'),
    )
    for django_subcommand, help_text in django_subcommands:
        subparsers._choices_actions.append(
            subparsers._ChoicesPseudoAction(
                django_subcommand,
                (),
                help_text))

    return parser


def start(args):
    """
    Starts OpenSlides: Runs migrations and runs runserver.
    """
    settings_path = args.settings_path
    local_installation = is_local_installation()

    if settings_path is None:
        if local_installation:
            settings_path = get_local_settings_path()
        else:
            settings_path = get_default_settings_path()

    # Write settings if it does not exists.
    if not os.path.isfile(settings_path):
        createsettings(args)

    # Set the django setting module and run migrations
    # A manual given environment variable will be overwritten
    setup_django_settings_module(settings_path, local_installation=local_installation)

    execute_from_command_line(['manage.py', 'migrate'])

    # Open the browser
    if not args.no_browser:
        if args.host == '0.0.0.0':
            # Windows does not support 0.0.0.0, so use 'localhost' instead
            start_browser('http://localhost:%s' % args.port)
        else:
            start_browser('http://%s:%s' % (args.host, args.port))

    # Start the webserver
    # Tell django not to reload. OpenSlides uses the reload method from tornado
    execute_from_command_line(['manage.py', 'runserver', '%s:%s' % (args.host, args.port), '--noreload'])


def createsettings(args):
    """
    Creates settings for OpenSlides.
    """
    settings_path = args.settings_path
    local_installation = is_local_installation()
    context = {}

    if local_installation:
        if settings_path is None:
            settings_path = get_local_settings_path()
        context = {
            'openslides_user_data_path': repr(os.path.join(os.getcwd(), 'personal_data', 'var')),
            'debug': 'True'}

    settings_path = write_settings(settings_path, **context)
    print('Settings created at %s' % settings_path)


if __name__ == "__main__":
    sys.exit(main())
