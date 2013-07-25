#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.main
    ~~~~~~~~~~~~~~~

    Main script to start and set up OpenSlides.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import base64
import ctypes
import optparse
import os
import socket
import sys
import tempfile
import threading
import time
import webbrowser

from django.conf import ENVIRONMENT_VARIABLE
from django.core.management import execute_from_command_line

from openslides import get_version
from openslides.utils.tornado_webserver import run_tornado


CONFIG_TEMPLATE = """#!/usr/bin/env python
# -*- coding: utf-8 -*-

import openslides.main
from openslides.global_settings import *

# Use 'DEBUG = True' to get more details for server errors
# (Default for releases: 'False')
DEBUG = False
TEMPLATE_DEBUG = DEBUG

DBPATH = %(dbpath)s

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DBPATH,
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }
}

# Set timezone
TIME_ZONE = 'Europe/Berlin'

# Make this unique, and don't share it with anybody.
SECRET_KEY = %(default_key)r

# Add OpenSlides plugins to this list (see example entry in comment)
INSTALLED_PLUGINS = (
#    'pluginname',
)

INSTALLED_APPS += INSTALLED_PLUGINS

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = %(media_root_path)s

"""

KEY_LENGTH = 30

# sentinel used to signal that the database ought to be stored
# relative to the portable's directory
_portable_db_path = object()


def process_options(argv=None, manage_runserver=False):
    if argv is None:
        argv = sys.argv[1:]

    parser = optparse.OptionParser(
        description="Run openslides using the tornado webserver")
    parser.add_option(
        "-a", "--address",
        help="IP Address to listen on. Default: 0.0.0.0")
    parser.add_option(
        "-p", "--port", type="int",
        help="Port to listen on. Default: 8000 (start as admin/root: 80)")
    parser.add_option(
        "--syncdb", action="store_true",
        help="Update/create database before starting the server.")
    parser.add_option(
        "--backupdb", action="store", metavar="BACKUP_PATH",
        help="Make a backup copy of the database to BACKUP_PATH.")
    parser.add_option(
        "--reset-admin", action="store_true",
        help="Make sure the user 'admin' exists and uses 'admin' as password.")
    parser.add_option(
        "-s", "--settings", help="Set the path to the settings file.")
    parser.add_option(
        "--no-browser",
        action="store_false", dest="start_browser", default=True,
        help="Do not automatically start the web browser.")
    parser.add_option(
        "--no-reload", action="store_true",
        help="Do not reload the web server.")
    parser.add_option(
        "--no-run", action="store_true",
        help="Do not start the web server.")
    parser.add_option(
        "--version", action="store_true",
        help="Show version and exit.")

    opts, args = parser.parse_args(argv)

    # Do not parse any argv if the script is started via manage.py runserver.
    # This simulates the django runserver command
    if manage_runserver:
        opts.start_browser = False
        opts.no_reload = False
        return opts

    if opts.version:
        print get_version()
        exit(0)

    if args:
        sys.stderr.write("This command does not take arguments!\n\n")
        parser.print_help()
        sys.exit(1)

    return opts


def main(argv=None, manage_runserver=False):
    opts = process_options(argv, manage_runserver)
    _main(opts)


def win32_portable_main(argv=None):
    """special entry point for the win32 portable version"""

    opts = process_options(argv)

    database_path = None

    if opts.settings is None:
        portable_dir = get_portable_path()
        try:
            fd, test_file = tempfile.mkstemp(dir=portable_dir)
        except OSError:
            portable_dir_writeable = False
        else:
            portable_dir_writeable = True
            os.close(fd)
            os.unlink(test_file)

        if portable_dir_writeable:
            opts.settings = os.path.join(
                portable_dir, "openslides", "settings.py")
            database_path = _portable_db_path

    _main(opts, database_path=database_path)


def _main(opts, database_path=None):
    # Find the path to the settings
    settings_path = opts.settings
    if settings_path is None:
        settings_path = get_user_config_path('openslides', 'settings.py')

    # Create settings if necessary
    if not os.path.exists(settings_path):
        create_settings(settings_path, database_path)

    # Set the django environment to the settings
    setup_django_environment(settings_path)

    # Find url to openslides
    addr, port = detect_listen_opts(opts.address, opts.port)

    # Create Database if necessary
    if not database_exists() or opts.syncdb:
        run_syncdb()

    # Reset Admin
    elif opts.reset_admin:
        reset_admin_user()

    if opts.backupdb:
        backup_database(opts.backupdb)

    if opts.no_run:
        return

    # Start OpenSlides
    reload = True
    if opts.no_reload:
        reload = False

    if opts.start_browser:
        if opts.address:
            prefix = opts.address
        else:
            prefix = 'localhost'
        if port == 80:
            suffix = ""
        else:
            suffix = ":%d" % port
        start_browser("http://%s%s" % (prefix, suffix))

    # Start the server
    run_tornado(addr, port, reload)


def create_settings(settings_path, database_path=None):
    settings_module = os.path.dirname(settings_path)

    if database_path is _portable_db_path:
        database_path = get_portable_db_path()
        dbpath_value = 'openslides.main.get_portable_db_path()'
        media_root_path_value = 'openslides.main.get_portable_media_root_path()'
    else:
        if database_path is None:
            database_path = get_user_data_path('openslides', 'database.sqlite')
        dbpath_value = repr(fs2unicode(database_path))
        media_root_path_value = repr(fs2unicode(get_user_data_path('openslides', 'media', '')))

    settings_content = CONFIG_TEMPLATE % dict(
        default_key=base64.b64encode(os.urandom(KEY_LENGTH)),
        dbpath=dbpath_value,
        media_root_path=media_root_path_value)

    if not os.path.exists(settings_module):
        os.makedirs(settings_module)

    if not os.path.exists(os.path.dirname(database_path)):
        os.makedirs(os.path.dirname(database_path))

    with open(settings_path, 'w') as file:
        file.write(settings_content)


def setup_django_environment(settings_path):
    settings_file = os.path.basename(settings_path)
    settings_module_name = "".join(settings_file.split('.')[:-1])
    if '.' in settings_module_name:
        print "'.' is not an allowed character in the settings-file"
        sys.exit(1)
    settings_module_dir = os.path.dirname(settings_path)
    sys.path.append(settings_module_dir)
    os.environ[ENVIRONMENT_VARIABLE] = '%s' % settings_module_name


def detect_listen_opts(address=None, port=None):
    if address is None:
        address = "0.0.0.0"

    if port is None:
        # test if we can use port 80
        s = socket.socket()
        port = 80
        try:
            s.bind((address, port))
            s.listen(-1)
        except socket.error:
            port = 8000
        finally:
            s.close()

    return address, port


def database_exists():
    """Detect if database exists"""
    # can't be imported in global scope as they already require
    # the settings module during import
    from django.db import DatabaseError
    from django.core.exceptions import ImproperlyConfigured
    from openslides.participant.models import User

    try:
        # TODO: Use another model, the User could be deactivated
        User.objects.count()
    except DatabaseError:
        return False
    except ImproperlyConfigured:
        print "Your settings file seems broken"
        sys.exit(0)
    else:
        return True


def run_syncdb():
    # now initialize the database
    argv = ["", "syncdb", "--noinput"]
    execute_from_command_line(argv)


def reset_admin_user():
    # can't be imported in global scope as it already requires
    # the settings module during import
    from openslides.participant.api import create_or_reset_admin_user
    create_or_reset_admin_user()


def backup_database(dest_path):
    argv = ["", "backupdb", "--destination={0}".format(dest_path)]
    execute_from_command_line(argv)


def start_browser(url):
    browser = webbrowser.get()

    def f():
        time.sleep(1)
        browser.open(url)

    t = threading.Thread(target=f)
    t.start()


def fs2unicode(s):
    if isinstance(s, unicode):
        return s
    fs_encoding = sys.getfilesystemencoding() or sys.getdefaultencoding()
    return s.decode(fs_encoding)


def get_user_config_path(*args):
    if sys.platform == "win32":
        return win32_get_app_data_path(*args)

    config_home = os.environ.get(
        'XDG_CONFIG_HOME', os.path.join(os.path.expanduser('~'), '.config'))

    return os.path.join(fs2unicode(config_home), *args)


def get_user_data_path(*args):
    if sys.platform == "win32":
        return win32_get_app_data_path(*args)

    data_home = os.environ.get(
        'XDG_DATA_HOME', os.path.join(
            os.path.expanduser('~'), '.local', 'share'))

    return os.path.join(fs2unicode(data_home), *args)


def is_portable():
    """Return True if openslides is run as portable version"""

    # NOTE: sys.executable is the path of the *interpreter*
    #       the portable version embeds python so it *is* the interpreter.
    #       The wrappers generated by pip and co. will spawn
    #       the usual python(w).exe, so there is no danger of mistaking
    #       them for the portable even though they may also be called
    #       openslides.exe
    exename = os.path.basename(sys.executable).lower()
    return exename == "openslides.exe"


def get_portable_path(*args):
    # NOTE: sys.executable will be the path to openslides.exe
    #       since it is essentially a small wrapper that embeds the
    #       python interpreter

    if not is_portable():
        raise Exception(
            "Cannot determine portable path when "
            "not running as portable")

    portable_dir = fs2unicode(os.path.dirname(os.path.abspath(sys.executable)))
    return os.path.join(portable_dir, *args)


def get_portable_db_path():
    return get_portable_path('openslides', 'database.sqlite')


def get_portable_media_root_path():
    return get_portable_path('openslides', 'media', '')


def win32_get_app_data_path(*args):
    shell32 = ctypes.WinDLL("shell32.dll")
    SHGetFolderPath = shell32.SHGetFolderPathW
    SHGetFolderPath.argtypes = (
        ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32,
        ctypes.c_wchar_p)
    SHGetFolderPath.restype = ctypes.c_uint32

    CSIDL_LOCAL_APPDATA = 0x001c
    MAX_PATH = 260

    buf = ctypes.create_unicode_buffer(MAX_PATH)
    res = SHGetFolderPath(0, CSIDL_LOCAL_APPDATA, 0, 0, buf)
    if res != 0:
        raise Exception("Could not deterime APPDATA path")

    return os.path.join(buf.value, *args)


if __name__ == "__main__":
    if is_portable():
        win32_portable_main()
    else:
        main()
