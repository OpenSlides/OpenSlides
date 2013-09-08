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
import base64
import imp
import os
import shutil
import socket
import sys
import time
import threading
import webbrowser

from django.conf import ENVIRONMENT_VARIABLE
from django.core.management import execute_from_command_line

from openslides import get_version
from openslides.utils.tornado_webserver import run_tornado
from openslides.utils.main import (
    filesystem2unicode,
    detect_openslides_type,
    get_win32_app_data_path,
    get_win32_portable_path,
    UNIX_VERSION,
    WINDOWS_VERSION,
    WINDOWS_PORTABLE_VERSION)


SETTINGS_TEMPLATE = """# -*- coding: utf-8 -*-
#
# Settings file for OpenSlides
#

%(import_function)s
from openslides.global_settings import *

# Use 'DEBUG = True' to get more details for server errors. Default for releases: False
DEBUG = False
TEMPLATE_DEBUG = DEBUG

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': %(database_path_value)s,
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }
}

# Set timezone
TIME_ZONE = 'Europe/Berlin'

# Make this unique, and don't share it with anybody.
SECRET_KEY = %(secret_key)r

# Add OpenSlides plugins to this list (see example entry in comment)
INSTALLED_PLUGINS = (
#    'pluginname',
)

INSTALLED_APPS += INSTALLED_PLUGINS

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = %(media_path_value)s
"""


def main():
    """
    Main entrance to OpenSlides.
    """
    # Parse all command line args.
    args = parse_args()

    # Setup settings path: Take it either from command line or get default path
    if not hasattr(args, 'settings') or not args.settings:
        openslides_type = detect_openslides_type()
        args.settings = get_default_settings_path(openslides_type)

    # Create settings if if still does not exist.
    if not os.path.exists(args.settings):
        # Setup path for local data (SQLite3 database, media, search index, ...):
        # Take it either from command line or get default path
        if not hasattr(args, 'localpath') or not args.localpath:
            openslides_type = detect_openslides_type()
            args.localpath = get_default_local_path(openslides_type)
            localpath_values = get_localpath_values(localpath=args.localpath, default=True, openslides_type=openslides_type)
        else:
            localpath_values = get_localpath_values(localpath=args.localpath, default=False)
        create_settings(args.settings, localpath_values)

    # Setup DJANGO_SETTINGS_MODULE environment variable
    if 'DJANGO_SETTINGS_MODULE' not in os.environ:
        setup_django_settings_module(args.settings)

    # Process the subcommand's callback
    return args.callback(args)


def parse_args():
    """
    Parses all command line arguments. The subcommand 'django' links to
    Django's command-line utility.
    """
    if len(sys.argv) == 1:
        sys.argv.append('start')

    description = 'Start script for OpenSlides.'
    if 'manage.py' not in sys.argv[0]:
        description += (' If it is called without any argument, this will be '
                        'treated as if it is called with the "start" subcommand. '
                        'That means OpenSlides will setup settings and database, '
                        'start the tornado webserver, launch the default web '
                        'browser and open the webinterface.')

    parser = argparse.ArgumentParser(description=description)

    parser.add_argument(
        '--version',
        action='version',
        version=get_version(),
        help='Show version number and exit.')

    subparsers = parser.add_subparsers(
        dest='subcommand',
        title='Available subcommands',
        description="Type 'python %s <subcommand> --help' for help on a specific subcommand." % parser.prog,
        help='You can choose only one subcommand at once.')

    settings_args, settings_kwargs = (
        ('-s', '--settings'),
        dict(help='Path to settings file.'))
    localpath_args, localpath_kwargs = (
        ('-l', '--localpath'),
        dict(help='Path to the directory for local files like SQLite3 database, '
                  'uploaded media and search index. This is only used, when a new '
                  'settings file is created.'))
    address_args, address_kwargs = (
        ('-a', '--address',),
        dict(default='0.0.0.0', help='IP address to listen on. Default is %(default)s.'))
    port_args, port_kwargs = (
        ('-p', '--port'),
        dict(type=int, default=80, help='Port to listen on. Default as admin or root is %(default)d, else 8000.'))

    # Subcommand start
    subcommand_start = subparsers.add_parser(
        'start',
        help='Setup settings and database, start tornado webserver, launch the '
             'default web browser and open the webinterface.')
    subcommand_start.add_argument(*settings_args, **settings_kwargs)
    subcommand_start.add_argument(*localpath_args, **localpath_kwargs)
    subcommand_start.add_argument(*address_args, **address_kwargs)
    subcommand_start.add_argument(*port_args, **port_kwargs)
    subcommand_start.set_defaults(callback=start)

    # Subcommand runserver
    subcommand_runserver = subparsers.add_parser(
        'runserver',
        help='Run OpenSlides using tornado webserver.')
    subcommand_runserver.add_argument(*settings_args, **settings_kwargs)
    subcommand_runserver.add_argument(*localpath_args, **localpath_kwargs)
    subcommand_runserver.add_argument(*address_args, **address_kwargs)
    subcommand_runserver.add_argument(*port_args, **port_kwargs)
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
    subcommand_syncdb.add_argument(*settings_args, **settings_kwargs)
    subcommand_syncdb.add_argument(*localpath_args, **localpath_kwargs)
    subcommand_syncdb.set_defaults(callback=syncdb)

    # Subcommand createsuperuser
    subcommand_createsuperuser = subparsers.add_parser(
        'createsuperuser',
        help="Make sure the user 'admin' exists and uses 'admin' as password.")
    subcommand_createsuperuser.add_argument(*settings_args, **settings_kwargs)
    subcommand_createsuperuser.add_argument(*localpath_args, **localpath_kwargs)
    subcommand_createsuperuser.set_defaults(callback=createsuperuser)

    # Subcommand backupdb
    subcommand_backupdb = subparsers.add_parser(
        'backupdb',
        help='Store a backup copy of the SQLite3 database.')
    subcommand_backupdb.add_argument(*settings_args, **settings_kwargs)
    subcommand_backupdb.add_argument(*localpath_args, **localpath_kwargs)
    subcommand_backupdb.add_argument(
        'path',
        help='Path to the backup file. An existing file will be overwritten.')
    subcommand_backupdb.set_defaults(callback=backupdb)

    # Subcommand deletedb
    subcommand_deletedb = subparsers.add_parser(
        'deletedb',
        help='Delete the SQLite3 database.')
    subcommand_deletedb.add_argument(*settings_args, **settings_kwargs)
    subcommand_deletedb.add_argument(*localpath_args, **localpath_kwargs)
    subcommand_deletedb.set_defaults(callback=deletedb)

    # Subcommand django
    subcommand_django_command_line_utility = subparsers.add_parser(
        'django',
        description="Link to Django's command-line utility. Type 'python %s django help' for more help on this." % parser.prog,
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


def get_default_local_path(openslides_type):
    """
    Returns the default local path according to the OpenSlides type.

    The argument 'openslides_type' has to be one of the three types mentioned in
    openslides.utils.main.
    """
    if openslides_type == UNIX_VERSION:
        default_local_path = filesystem2unicode(os.environ.get(
            'XDG_DATA_HOME', os.path.join(os.path.expanduser('~'), '.local', 'share')))
    elif openslides_type == WINDOWS_VERSION:
        default_local_path = get_win32_app_data_path()
    elif openslides_type == WINDOWS_PORTABLE_VERSION:
        default_local_path = get_win32_portable_path()
    else:
        raise TypeError('%s is not a valid OpenSlides type.' % openslides_type)
    return default_local_path


def get_localpath_values(localpath, default=False, openslides_type=None):
    """
    Returns the local path values for the new settings file.

    The argument 'localpath' is a path to the directory where OpenSlides should
    store the local data like SQLite3 database, media and search index.

    The argument 'default' is a simple flag. If it is True and the OpenSlides
    type is the Windows portable version, this function returns callable
    functions for the settings file, else it returns string paths.

    The argument 'openslides_type' can to be one of the three types mentioned in
    openslides.utils.main.
    """
    localpath_values = {}
    if default and openslides_type == WINDOWS_PORTABLE_VERSION:
        localpath_values['import_function'] = 'from openslides.utils.main import get_portable_paths'
        localpath_values['database_path_value'] = "get_portable_paths('database')"
        localpath_values['media_path_value'] = "get_portable_paths('media')"
    else:
        localpath_values['import_function'] = ''
        # TODO: Decide whether to use only absolute paths here.
        localpath_values['database_path_value'] = "'%s'" % os.path.join(localpath, 'openslides', 'database.sqlite')
        # TODO: Decide whether to use only absolute paths here.
        localpath_values['media_path_value'] = "'%s'" % os.path.join(localpath, 'openslides', 'media', '')
    return localpath_values


def create_settings(settings_path, local_path_values):
    """
    Creates the settings file at the given path using the given values for the
    file template.
    """
    settings_module = os.path.realpath(os.path.dirname(settings_path))
    if not os.path.exists(settings_module):
        os.makedirs(settings_module)
    context = {'secret_key': base64.b64encode(os.urandom(30))}
    context.update(local_path_values)
    settings_content = SETTINGS_TEMPLATE % context
    with open(settings_path, 'w') as settings_file:
        settings_file.write(settings_content)
    print('Settings file at %s successfully created.' % settings_path)


def setup_django_settings_module(settings_path):
    """
    Sets the environment variable DJANGO_SETTINGS_MODULE to the given settings.
    """
    settings_file = os.path.basename(settings_path)
    settings_module_name = "".join(settings_file.split('.')[:-1])
    if '.' in settings_module_name:
        print("'.' is not an allowed character in the settings-file")
        sys.exit(1)
    settings_module_dir = os.path.dirname(settings_path)
    sys.path.append(settings_module_dir)
    os.environ[ENVIRONMENT_VARIABLE] = '%s' % settings_module_name


def start(args):
    """
    Starts OpenSlides: Runs syncdb and runs runserver (tornado webserver) with
    the flag 'start_browser'.
    """
    syncdb(args)
    args.start_browser = True
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


def get_port(address, port):
    """
    Returns the port for the server. If port 80 is given, checks if it is
    available. If not returns port 8000.

    The argument 'address' should be an IP address. The argument 'port' should
    be an integer.
    """
    if port == 80:
        # test if we can use port 80
        s = socket.socket()
        try:
            s.bind((address, port))
            s.listen(-1)
        except socket.error:
            port = 8000
        finally:
            s.close()
    return port


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
    path = filesystem2unicode(os.path.dirname(get_database_path_from_settings(args.settings)))
    if not os.path.exists(path):
        os.makedirs(path)
    execute_from_command_line(["", "syncdb", "--noinput"])


def get_database_path_from_settings(settings_path):
    """
    Retrieves the database path out of the given settings file. Returns None,
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
    Stores a backup copy of the SQlite3 database.
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
        except IOError as e:
            raise Exception("Database backup failed.")
        # and release the lock again
        transaction.commit()

    database_path = get_database_path_from_settings(args.settings)
    if database_path:
        do_backup(database_path, args.path)
        print('Database %s successfully stored at %s.' % (database_path, args.path))
        return_value = 0
    else:
        print('Error: Default database is not SQLite3. Only SQLite3 databases can currently be backuped.')
        return_value = 1
    return return_value


def deletedb(args):
    """
    Deletes the sqlite3 database. Returns 0 on success, else 1.
    """
    database_path = get_database_path_from_settings(args.settings)
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
        print("Error: The command '%s' is disabled for use via Django's command line utility." % command)
        return_value = 1
    else:
        execute_from_command_line(args.django_args)
        return_value = 0
    return return_value


if __name__ == "__main__":
    exit(main())
