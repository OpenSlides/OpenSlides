#!/usr/bin/env python

import os
import sys
from typing import Dict

import django
from django.core.management import call_command, execute_from_command_line

import openslides
from openslides.utils.arguments import arguments
from openslides.utils.main import (
    ExceptionArgumentParser,
    UnknownCommand,
    get_default_settings_dir,
    get_local_settings_dir,
    is_local_installation,
    open_browser,
    setup_django_settings_module,
    write_settings,
)
from openslides.utils.startup import run_startup_hooks


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
            joined_unknown_args = " ".join(unknown_args)
            parser.error(f"Unknown arguments {joined_unknown_args}")

        # Save arguments, if one wants to access them later.
        arguments.set_arguments(known_args)

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
        sys.argv.append("start")

    # Init parser
    description = "Start script for OpenSlides."
    if "manage.py" not in sys.argv[0]:
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
    parser = ExceptionArgumentParser(description=description, epilog=epilog)

    # Add version argument
    parser.add_argument(
        "--version",
        action="version",
        version=openslides.__version__,
        help="Show version number and exit.",
    )

    # Init subparsers
    subparsers = parser.add_subparsers(
        dest="subcommand",
        title="Available subcommands",
        description="Type '%s <subcommand> --help' for help on a "
        "specific subcommand." % parser.prog,  # type: ignore
        help="You can choose only one subcommand at once.",
        metavar="",
    )

    # Subcommand start
    start_help = (
        "Setup settings and database, start webserver, launch the "
        "default web browser and open the webinterface. The environment "
        "variable DJANGO_SETTINGS_MODULE is ignored."
    )
    subcommand_start = subparsers.add_parser(
        "start", description=start_help, help=start_help
    )
    subcommand_start.set_defaults(callback=start)
    subcommand_start.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not launch the default web browser.",
    )
    subcommand_start.add_argument(
        "--debug-email",
        action="store_true",
        help="Change the email backend to console output.",
    )
    subcommand_start.add_argument(
        "--no-template-caching",
        action="store_true",
        default=False,
        help="Disables caching of templates.",
    )
    subcommand_start.add_argument(
        "--host",
        action="store",
        default="0.0.0.0",
        help="IP address to listen on. Default is 0.0.0.0.",
    )
    subcommand_start.add_argument(
        "--port",
        action="store",
        default="8000",
        help="Port to listen on. Default is 8000.",
    )
    subcommand_start.add_argument(
        "--settings_dir", action="store", default=None, help="The settings directory."
    )
    subcommand_start.add_argument(
        "--settings_filename",
        action="store",
        default="settings.py",
        help="The used settings file name. The file is created, if it does not exist.",
    )
    subcommand_start.add_argument(
        "--local-installation",
        action="store_true",
        help="Store settings and user files in a local directory.",
    )

    # Subcommand createsettings
    createsettings_help = "Creates the settings file."
    subcommand_createsettings = subparsers.add_parser(
        "createsettings", description=createsettings_help, help=createsettings_help
    )
    subcommand_createsettings.set_defaults(callback=createsettings)
    subcommand_createsettings.add_argument(
        "--settings_dir",
        action="store",
        default=None,
        help="The used settings file directory. All settings files are created, even if they exist.",
    )
    subcommand_createsettings.add_argument(
        "--settings_filename",
        action="store",
        default="settings.py",
        help="The used settings file name. The file is created, if it does not exist.",
    )
    subcommand_createsettings.add_argument(
        "--local-installation",
        action="store_true",
        help="Store settings and user files in a local directory.",
    )

    # Help text for several Django subcommands
    django_subcommands = (
        ("backupdb", "Backups the SQLite3 database."),
        ("createsuperuser", "Creates or resets the admin user."),
        ("migrate", "Updates database schema."),
        ("runserver", "Starts the built-in webserver."),
    )
    for django_subcommand, help_text in django_subcommands:
        subparsers._choices_actions.append(  # type: ignore
            subparsers._ChoicesPseudoAction(  # type: ignore
                django_subcommand, (), help_text
            )
        )

    return parser


def start(args):
    """
    Starts OpenSlides: Runs migrations and runs runserver.
    """
    settings_dir = args.settings_dir
    settings_filename = args.settings_filename
    local_installation = is_local_installation()

    if settings_dir is None:
        if local_installation:
            settings_dir = get_local_settings_dir()
        else:
            settings_dir = get_default_settings_dir()

    # Write django settings if it does not exists.
    settings_path = os.path.join(settings_dir, settings_filename)
    if not os.path.isfile(settings_path):
        createsettings(args)

    # Set the django setting module and run migrations
    # A manual given environment variable will be overwritten
    setup_django_settings_module(settings_path, local_installation=local_installation)
    django.setup()

    # Migrate database
    call_command("migrate")

    # Open the browser
    if not args.no_browser:
        open_browser(args.host, args.port)

    run_startup_hooks()

    # Start the built-in webserver
    #
    # Use flag --noreload to tell Django not to reload the server.
    # Therefore we have to set the keyword noreload to False because Django
    # parses this directly to the use_reloader keyword.
    #
    # Use flag --insecure to serve static files even if DEBUG is False.
    call_command(
        "runserver",
        f"{args.host}:{args.port}",
        noreload=False,  # Means True, see above.
        insecure=True,
        debug_email=args.debug_email,
    )


def createsettings(args):
    """
    Creates settings for OpenSlides.
    """
    settings_dir = args.settings_dir
    local_installation = is_local_installation()
    context: Dict[str, str] = {}

    if local_installation:
        if settings_dir is None:
            settings_dir = get_local_settings_dir()
        context = {
            "openslides_user_data_dir": repr(
                os.path.join(os.getcwd(), "personal_data", "var")
            ),
            "debug": "True",
        }

    settings_path = write_settings(settings_dir, args.settings_filename, **context)
    print(f"Settings created at {settings_path}")


if __name__ == "__main__":
    sys.exit(main())
