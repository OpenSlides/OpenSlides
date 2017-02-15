#!/usr/bin/env python

import os
import subprocess
import sys

import django
from django.core.management import call_command, execute_from_command_line

from openslides import __version__ as openslides_version
from openslides.utils.main import (
    ExceptionArgumentParser,
    UnknownCommand,
    get_default_settings_path,
    get_geiss_path,
    get_local_settings_path,
    is_local_installation,
    open_browser,
    setup_django_settings_module,
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
        # Check for unknown_args.
        if unknown_args:
            parser.error('Unknown arguments {}'.format(' '.join(unknown_args)))
        # Run a command that is defined here
        # These are commands that can not rely on an existing settings
        known_args.callback(known_args)


def get_parser():
    """
    Parses all command line arguments.
    """
    if len(sys.argv) == 1:
        # Use start subcommand if called by openslides console script without
        # any other arguments.
        sys.argv.append('start')

    # Init parser
    description = 'Start script for OpenSlides.'
    if 'manage.py' not in sys.argv[0]:
        description += """
            If it is called without any argument, this will be treated as
            if it is called with the 'start' subcommand. That means
            OpenSlides will setup default settings and database, start the
            webserver, launch the default web browser and open the
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
        'Setup settings and database, start webserver, launch the '
        'default web browser and open the webinterface. The environment '
        'variable DJANGO_SETTINGS_MODULE is ignored.')
    subcommand_start = subparsers.add_parser(
        'start',
        description=start_help,
        help=start_help)
    subcommand_start.set_defaults(callback=start)
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
    subcommand_start.add_argument(
        '--local-installation',
        action='store_true',
        help='Store settings and user files in a local directory.')
    subcommand_start.add_argument(
        '--use-geiss',
        action='store_true',
        help='Use Geiss instead of Daphne as ASGI protocol server.')

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
    django.setup()
    from django.conf import settings

    # Migrate database
    call_command('migrate')

    if args.use_geiss:
        # Make sure Redis is used.
        if settings.CHANNEL_LAYERS['default']['BACKEND'] != 'asgi_redis.RedisChannelLayer':
            raise RuntimeError("You have to use the ASGI Redis backend in the settings to use Geiss.")

        # Download Geiss and collect the static files.
        call_command('getgeiss')
        call_command('collectstatic', interactive=False)

        # Open the browser
        if not args.no_browser:
            open_browser(args.host, args.port)

        # Start Geiss in its own thread
        subprocess.Popen([
            get_geiss_path(),
            '--host', args.host,
            '--port', args.port,
            '--static', '/static/:{}'.format(settings.STATIC_ROOT),
            '--static', '/media/:{}'.format(settings.MEDIA_ROOT),
        ])

        # Start one worker in this thread. There can be only one worker as
        # long as SQLite3 is used.
        call_command('runworker')

    else:
        # Open the browser
        if not args.no_browser:
            open_browser(args.host, args.port)

        # Start Daphne and one worker
        #
        # Use flag --noreload to tell Django not to reload the server.
        # Therefor we have to set the keyword noreload to False because Django
        # parses this directly to the use_reloader keyword.
        #
        # Use flag --insecure to serve static files even if DEBUG is False.
        #
        # Use flag --nothreading to tell Django Channels to run in single
        # thread mode with one worker only. Therefor we have to set the keyword
        # nothreading to False because Django parses this directly to
        # use_threading keyword.
        call_command(
            'runserver',
            '{}:{}'.format(args.host, args.port),
            noreload=False,  # Means True, see above.
            insecure=True,
            nothreading=False,  # Means True, see above.
        )


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
