#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.__main__
    ~~~~~~~~~~~~~~~~~~~

    Main script for OpenSlides

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import argparse
import os
import shutil
import sys
import time
import threading
import webbrowser

from django.conf import ENVIRONMENT_VARIABLE
from django.core.exceptions import ImproperlyConfigured
from django.core.management import execute_from_command_line

from openslides import get_version
from openslides.utils.main import (
    filesystem2unicode,
    detect_openslides_type,
    get_default_user_data_path,
    get_port,
    get_win32_app_data_path,
    get_win32_portable_path,
    UNIX_VERSION,
    WINDOWS_VERSION,
    WINDOWS_PORTABLE_VERSION,
    create_settings)
from openslides.utils.tornado_webserver import run_tornado


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

    # Create settings if if still does not exist.
    if settings and not os.path.exists(settings):
        # Setup path for user specific data (SQLite3 database, media, search index, ...):
        # Take it either from command line or get default path
        if hasattr(args, 'user_data_path') and args.user_data_path:
            user_data_path_values = get_user_data_path_values(
                user_data_path=args.user_data_path,
                default=False)
        else:
            openslides_type = detect_openslides_type()
            args.user_data_path = get_default_user_data_path(openslides_type)
            user_data_path_values = get_user_data_path_values(
                user_data_path=args.user_data_path,
                default=True,
                openslides_type=openslides_type)
        create_settings(settings, **user_data_path_values)
        print('Settings file at %s successfully created.' % settings)

    # Process the subcommand's callback
    return args.callback(args)


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
        description="Type 'python %s <subcommand> --help' for help on a "
                    "specific subcommand." % parser.prog,
        help='You can choose only one subcommand at once.')

    # Subcommand start
    subcommand_start = subparsers.add_parser(
        'start',
        help='Setup settings and database, start tornado webserver, launch the '
             'default web browser and open the webinterface.')
    add_general_arguments(subcommand_start, ('settings', 'user_data_path', 'address', 'port'))
    subcommand_start.add_argument(
        '--no-browser',
        action='store_true',
        help='Do not launch the default web browser.')
    subcommand_start.set_defaults(callback=start)

    # Subcommand runserver
    subcommand_runserver = subparsers.add_parser(
        'runserver',
        help='Run OpenSlides using tornado webserver.')
    add_general_arguments(subcommand_runserver, ('settings', 'user_data_path', 'address', 'port'))
    subcommand_runserver.add_argument(
        '--start-browser',
        action='store_true',
        help='Launch the default web browser and open the webinterface.')
    subcommand_runserver.add_argument(
        '--no-reload',
        action='store_true',
        help='Do not reload the webserver if source code changes.')
    subcommand_runserver.set_defaults(callback=runserver)

    # Subcommand syncdb
    subcommand_syncdb = subparsers.add_parser(
        'syncdb',
        help='Create or update database tables.')
    add_general_arguments(subcommand_syncdb, ('settings', 'user_data_path'))
    subcommand_syncdb.set_defaults(callback=syncdb)

    # Subcommand createsuperuser
    subcommand_createsuperuser = subparsers.add_parser(
        'createsuperuser',
        help="Make sure the user 'admin' exists and uses 'admin' as password.")
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

    # Subcommand django
    subcommand_django_command_line_utility = subparsers.add_parser(
        'django',
        description="Link to Django's command-line utility. Type "
                    "'python %s django help' for more help on this." % parser.prog,
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
        dict(help="Path to settings file. If this isn't provided, the "
                  "%s environment variable will be used. "
                  "If this isn't provided too, a default path according to the "
                  "OpenSlides type will be used. At the moment it is %s" % (
                      ENVIRONMENT_VARIABLE,
                      get_default_settings_path(openslides_type))))
    general_arguments['user_data_path'] = (
        ('-d', '--user-data-path'),
        dict(help='Path to the directory for user specific data files like SQLite3 '
                  'database, uploaded media and search index. This is only used, '
                  'when a new settings file is created. The given path is only '
                  'written into the new settings file. Default according to the '
                  'OpenSlides is at the moment %s' % get_default_user_data_path(openslides_type)))
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


def get_default_settings_path(openslides_type):
    """
    Returns the default settings path according to the OpenSlides type.

    The argument 'openslides_type' has to be one of the three types mentioned in
    openslides.utils.main.
    """
    if openslides_type == UNIX_VERSION:
        parent_directory = filesystem2unicode(os.environ.get(
            'XDG_CONFIG_HOME', os.path.join(os.path.expanduser('~'), '.config')))
    elif openslides_type == WINDOWS_VERSION:
        parent_directory = get_win32_app_data_path()
    elif openslides_type == WINDOWS_PORTABLE_VERSION:
        parent_directory = get_win32_portable_path()
    else:
        raise TypeError('%s is not a valid OpenSlides type.' % openslides_type)
    return os.path.join(parent_directory, 'openslides', 'settings.py')


def get_user_data_path_values(user_data_path, default=False, openslides_type=None):
    """
    Returns a dictionary of the user specific data path values for the new
    settings file.

    The argument 'user_data_path' is a path to the directory where OpenSlides
    should store the user specific data like SQLite3 database, media and search
    index.

    The argument 'default' is a simple flag. If it is True and the OpenSlides
    type is the Windows portable version, the returned dictionary contains
    strings of callable functions for the settings file, else it contains
    string paths.

    The argument 'openslides_type' can to be one of the three types mentioned in
    openslides.utils.main.
    """
    user_data_path_values = {}
    if default and openslides_type == WINDOWS_PORTABLE_VERSION:
        user_data_path_values['import_function'] = 'from openslides.utils.main import get_portable_paths'
        user_data_path_values['database_path_value'] = "get_portable_paths('database')"
        user_data_path_values['media_path_value'] = "get_portable_paths('media')"
        user_data_path_values['whoosh_index_path_value'] = "get_portable_paths('whoosh_index')"
    else:
        user_data_path_values['local_share'] = os.path.join(user_data_path, 'openslides')
    return user_data_path_values


def setup_django_settings_module(settings_path):
    """
    Sets the environment variable ENVIRONMENT_VARIABLE, that means
    'DJANGO_SETTINGS_MODULE', to the given settings.
    """
    settings_file = os.path.basename(settings_path)
    settings_module_name = ".".join(settings_file.split('.')[:-1])
    if '.' in settings_module_name:
        raise ImproperlyConfigured("'.' is not an allowed character in the settings-file")
    settings_module_dir = os.path.dirname(settings_path)  # TODO: Use absolute path here or not?
    sys.path.insert(0, settings_module_dir)
    os.environ[ENVIRONMENT_VARIABLE] = '%s' % settings_module_name


def start(args):
    """
    Starts OpenSlides: Runs syncdb and runs runserver (tornado webserver).
    """
    syncdb(args)
    args.start_browser = not args.no_browser
    args.no_reload = False
    runserver(args)


def runserver(args):
    """
    Runs tornado webserver. Runs the function start_browser if the respective
    argument is given.
    """
    port = get_port(address=args.address, port=args.port)
    if args.start_browser:
        browser_url = get_browser_url(address=args.address, port=port)
        start_browser(browser_url)
    run_tornado(args.address, port, not args.no_reload)


def get_browser_url(address, port):
    """
    Returns the url to open the web browser.

    The argument 'address' should be an IP address. The argument 'port' should
    be an integer.
    """
    browser_url = 'http://'
    if address == '0.0.0.0':
        browser_url += 'localhost'
    else:
        browser_url += address
    if not port == 80:
        browser_url += ":%d" % port
    return browser_url


def start_browser(browser_url):
    """
    Launches the default web browser at the given url and opens the
    webinterface.
    """
    browser = webbrowser.get()

    def function():
        time.sleep(1)
        browser.open(browser_url)

    thread = threading.Thread(target=function)
    thread.start()


def syncdb(args):
    """
    Run syncdb to create or update the database.
    """
    # TODO: Check use of filesystem2unicode here.
    path = filesystem2unicode(os.path.dirname(get_database_path_from_settings()))
    if not os.path.exists(path):
        os.makedirs(path)
    execute_from_command_line(["", "syncdb", "--noinput"])
    return 0


def get_database_path_from_settings():
    """
    Retrieves the database path out of the settings file. Returns None,
    if it is not a SQLite3 database.
    """
    from django.conf import settings as django_settings
    from django.db import DEFAULT_DB_ALIAS

    db_settings = django_settings.DATABASES
    default = db_settings.get(DEFAULT_DB_ALIAS)
    if not default:
        raise Exception("Default databases is not configured")
    database_path = default.get('NAME')
    if not database_path:
        raise Exception('No path specified for default database.')
    if default.get('ENGINE') != 'django.db.backends.sqlite3':
        database_path = None
    return database_path


def createsuperuser(args):
    """
    Creates or resets the admin user. Returns 0 to show success.
    """
    # can't be imported in global scope as it already requires
    # the settings module during import
    from openslides.participant.api import create_or_reset_admin_user
    if create_or_reset_admin_user():
        print('Admin user successfully created.')
    else:
        print('Admin user successfully reset.')
    return 0


def backupdb(args):
    """
    Stores a backup copy of the SQlite3 database. Returns 0 on success, else 1.
    """
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


def deletedb(args):
    """
    Deletes the sqlite3 database. Returns 0 on success, else 1.
    """
    database_path = get_database_path_from_settings()
    if database_path and os.path.exists(database_path):
        os.remove(database_path)
        print('SQLite3 database file %s successfully deleted.' % database_path)
        return_value = 0
    else:
        print('SQLite3 database file %s does not exist.' % database_path)
        return_value = 1
    return return_value


def django_command_line_utility(args):
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
        execute_from_command_line(args.django_args)
        return_value = 0
    return return_value


if __name__ == "__main__":
    exit(main())
