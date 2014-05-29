#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import os
import shutil
import sys

from django.conf import ENVIRONMENT_VARIABLE
from django.core.management import execute_from_command_line

from openslides import get_version
from openslides.utils.main import (
    detect_openslides_type,
    ensure_settings,
    filesystem2unicode,
    get_browser_url,
    get_database_path_from_settings,
    get_default_settings_path,
    get_default_user_data_path,
    get_port,
    setup_django_settings_module,
    start_browser,
    translate_customizable_strings,
    write_settings)


def main():
    """
    Main entrance to OpenSlides.
    """
    # Parse all command line args.
    args = parse_args()

    # Setup settings path: Take it either from command line or get default path
    if hasattr(args, 'settings') and args.settings:
        settings = args.settings
        setup_django_settings_module(settings)
    else:
        if ENVIRONMENT_VARIABLE not in os.environ:
            openslides_type = detect_openslides_type()
            settings = get_default_settings_path(openslides_type)
            setup_django_settings_module(settings)
        else:
            # The environment variable is set, so we do not need to process
            # anything more here.
            settings = None

    # Process the subcommand's callback
    return args.callback(settings, args)


def parse_args():
    """
    Parses all command line arguments. The subcommand 'django' links to
    Django's command-line utility.
    """
    if len(sys.argv) == 1:
        sys.argv.append('start')

    # Init parser
    description = 'Start script for OpenSlides.'
    if 'manage.py' not in sys.argv[0]:
        description += (' If it is called without any argument, this will be '
                        'treated as if it is called with the "start" subcommand. '
                        'That means OpenSlides will setup default settings and '
                        'database, start the tornado webserver, launch the '
                        'default web browser and open the webinterface.')
    parser = argparse.ArgumentParser(description=description)

    # Add version argument
    parser.add_argument(
        '--version',
        action='version',
        version=get_version(),
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
             'default web browser and open the webinterface.')
    add_general_arguments(subcommand_start, ('settings', 'user_data_path', 'language', 'address', 'port'))
    subcommand_start.add_argument(
        '--no-browser',
        action='store_true',
        help='Do not launch the default web browser.')
    subcommand_start.set_defaults(callback=start)

    # Subcommand runserver
    subcommand_runserver = subparsers.add_parser(
        'runserver',
        help='Run OpenSlides using tornado webserver. The database tables must '
             'be created before. Use syncdb subcommand for this.')
    add_general_arguments(subcommand_runserver, ('settings', 'user_data_path', 'address', 'port'))
    subcommand_runserver.add_argument(
        '--start-browser',
        action='store_true',
        help='Launch the default web browser and open the webinterface.')
    subcommand_runserver.set_defaults(callback=runserver)

    # Subcommand syncdb
    subcommand_syncdb = subparsers.add_parser(
        'syncdb',
        help='Create or update database tables.')
    add_general_arguments(subcommand_syncdb, ('settings', 'user_data_path', 'language'))
    subcommand_syncdb.set_defaults(callback=syncdb)

    # Subcommand createsuperuser
    subcommand_createsuperuser = subparsers.add_parser(
        'createsuperuser',
        help="Make sure the user 'admin' exists and uses 'admin' as password. "
             "The database tables must be created before. Use syncdb subcommand for this.")
    add_general_arguments(subcommand_createsuperuser, ('settings', 'user_data_path'))
    subcommand_createsuperuser.set_defaults(callback=createsuperuser)

    # Subcommand backupdb
    subcommand_backupdb = subparsers.add_parser(
        'backupdb',
        help='Store a backup copy of the SQLite3 database at the given path.')
    add_general_arguments(subcommand_backupdb, ('settings', 'user_data_path'))
    subcommand_backupdb.add_argument(
        'path',
        help='Path to the backup file. An existing file will be overwritten.')
    subcommand_backupdb.set_defaults(callback=backupdb)

    # Subcommand deletedb
    subcommand_deletedb = subparsers.add_parser(
        'deletedb',
        help='Delete the SQLite3 database.')
    add_general_arguments(subcommand_deletedb, ('settings', 'user_data_path'))
    subcommand_deletedb.set_defaults(callback=deletedb)

    # Subcommand create-dev-settings
    subcommand_create_dev_settings = subparsers.add_parser(
        'create-dev-settings',
        help='Create a settings file at current working directory for development use.')
    subcommand_create_dev_settings.set_defaults(callback=create_dev_settings)

    # Subcommand django
    subcommand_django_command_line_utility = subparsers.add_parser(
        'django',
        description="Link to Django's command-line utility. Type "
                    "'%s django help' for more help on this." % parser.prog,
        help="Call Django's command-line utility.")
    subcommand_django_command_line_utility.set_defaults(
        callback=django_command_line_utility,
        django_args=['%s' % subcommand_django_command_line_utility.prog])

    known_args, unknown_args = parser.parse_known_args()

    if known_args.subcommand == 'django':
        if not unknown_args:
            unknown_args.append('help')
        known_args.django_args.extend(unknown_args)
    else:
        if unknown_args:
            parser.error('Unknown arguments %s found.' % ' '.join(unknown_args))

    return known_args


def add_general_arguments(subcommand, arguments):
    """
    Adds the named arguments to the subcommand.
    """
    general_arguments = {}
    openslides_type = detect_openslides_type()

    general_arguments['settings'] = (
        ('-s', '--settings'),
        dict(help="Path to settings file. The file must be a python module. "
                  "If if isn't provided, the %s environment variable will be "
                  "used. If the environment variable isn't provided too, a "
                  "default path according to the OpenSlides type will be "
                  "used. At the moment it is %s" % (
                      ENVIRONMENT_VARIABLE,
                      get_default_settings_path(openslides_type))))
    general_arguments['user_data_path'] = (
        ('-d', '--user-data-path'),
        dict(help='Path to the directory for user specific data files like SQLite3 '
                  'database, uploaded media and search index. It is only used, '
                  'when a new settings file is created. The given path is only '
                  'written into the new settings file. Default according to the '
                  'OpenSlides type is at the moment %s' % get_default_user_data_path(openslides_type)))
    general_arguments['language'] = (
        ('-l', '--language'),
        dict(help='Language code. All customizable strings will be translated '
                  'during database setup. See https://www.transifex.com/projects/p/openslides/ '
                  'for supported languages.'))
    general_arguments['address'] = (
        ('-a', '--address',),
        dict(default='0.0.0.0', help='IP address to listen on. Default is %(default)s.'))
    general_arguments['port'] = (
        ('-p', '--port'),
        dict(type=int,
             default=80,
             help='Port to listen on. Default as admin or root is %(default)d, else 8000.'))

    for argument in arguments:
        try:
            args, kwargs = general_arguments[argument]
        except KeyError:
            raise TypeError('The argument %s is not a valid general argument.' % argument)
        subcommand.add_argument(*args, **kwargs)


def start(settings, args):
    """
    Starts OpenSlides: Runs syncdb and runs runserver (tornado webserver).
    """
    ensure_settings(settings, args)
    syncdb(settings, args)
    args.start_browser = not args.no_browser
    runserver(settings, args)


def runserver(settings, args):
    """
    Runs tornado webserver. Runs the function start_browser if the respective
    argument is given.
    """
    ensure_settings(settings, args)
    port = get_port(address=args.address, port=args.port)
    if args.start_browser:
        browser_url = get_browser_url(address=args.address, port=port)
        start_browser(browser_url)

    # Now the settings is available and the function can be imported.
    from openslides.utils.tornado_webserver import run_tornado
    run_tornado(args.address, port)


def syncdb(settings, args):
    """
    Run syncdb to create or update the database.
    """
    ensure_settings(settings, args)
    # TODO: Check use of filesystem2unicode here.
    db_file = get_database_path_from_settings()
    if db_file is not None:
        db_dir = filesystem2unicode(os.path.dirname(db_file))
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)
        if not os.path.exists(db_file):
            print('Clearing old search index...')
            execute_from_command_line(["", "clear_index", "--noinput"])
    execute_from_command_line(["", "syncdb", "--noinput"])
    if args.language:
        translate_customizable_strings(args.language)
    return 0


def createsuperuser(settings, args):
    """
    Creates or resets the admin user. Returns 0 to show success.
    """
    ensure_settings(settings, args)
    # can't be imported in global scope as it already requires
    # the settings module during import
    from openslides.participant.api import create_or_reset_admin_user
    if create_or_reset_admin_user():
        print('Admin user successfully created.')
    else:
        print('Admin user successfully reset.')
    return 0


def backupdb(settings, args):
    """
    Stores a backup copy of the SQlite3 database. Returns 0 on success, else 1.
    """
    ensure_settings(settings, args)

    from django.db import connection, transaction

    @transaction.commit_manually
    def do_backup(src_path, dest_path):
        # perform a simple file-copy backup of the database
        # first we need a shared lock on the database, issuing a select()
        # will do this for us
        cursor = connection.cursor()
        cursor.execute("SELECT count(*) from sqlite_master")
        # now copy the file
        try:
            shutil.copy(src_path, dest_path)
        except IOError:
            raise Exception("Database backup failed.")
        # and release the lock again
        transaction.commit()

    database_path = get_database_path_from_settings()
    if database_path:
        do_backup(database_path, args.path)
        print('Database %s successfully stored at %s.' % (database_path, args.path))
        return_value = 0
    else:
        print('Error: Default database is not SQLite3. Only SQLite3 databases '
              'can currently be backuped.')
        return_value = 1
    return return_value


def deletedb(settings, args):
    """
    Deletes the sqlite3 database. Returns 0 on success, else 1.
    """
    ensure_settings(settings, args)
    database_path = get_database_path_from_settings()
    if database_path and os.path.exists(database_path):
        os.remove(database_path)
        print('SQLite3 database file %s successfully deleted.' % database_path)
        execute_from_command_line(["", "clear_index", "--noinput"])
        print('Whoosh search index successfully cleared.')
        return_value = 0
    else:
        print('SQLite3 database file %s does not exist.' % database_path)
        return_value = 1
    return return_value


def create_dev_settings(settings, args):
    """
    Creates a settings file at the currect working directory for development use.
    """
    settings = os.path.join(os.getcwd(), 'settings.py')
    if not os.path.exists(settings):
        context = {}
        context['openslides_user_data_path'] = repr(os.getcwd())
        context['import_function'] = ''
        context['debug'] = 'True'
        write_settings(settings, **context)
        print('Settings file at %s successfully created.' % settings)
        return_value = 0
    else:
        print('Error: Settings file %s already exists.' % settings)
        return_value = 1
    return return_value


def django_command_line_utility(settings, args):
    """
    Runs Django's command line utility. Returns 0 on success, else 1.
    """
    if 'runserver' in args.django_args:
        command = 'runserver'
    elif 'syncdb' in args.django_args:
        command = 'syncdb'
    elif 'createsuperuser' in args.django_args:
        command = 'createsuperuser'
    else:
        command = None
    if command:
        print("Error: The command '%s' is disabled in OpenSlides for use via Django's "
              "command line utility." % command)
        return_value = 1
    else:
        ensure_settings(settings, args)
        execute_from_command_line(args.django_args)
        return_value = 0
    return return_value


if __name__ == "__main__":
    exit(main())
