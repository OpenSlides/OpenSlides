#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.main
    ~~~~~~~~~~~~~~~

    Main script to start and set up OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

# for python 2.5 support
from __future__ import with_statement

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

import django.conf
from django.core.management import execute_from_command_line

from openslides import get_version

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
"""

KEY_LENGTH = 30

# sentinel used to signal that the database ought to be stored
# relative to the portable's directory
_portable_db_path = object()


def process_options(argv=None):
    if argv is None:
        argv = sys.argv[1:]

    parser = optparse.OptionParser(
        description="Run openslides using django's builtin webserver")
    parser.add_option("-a", "--address", help="IP Address to listen on.")
    parser.add_option("-p", "--port", type="int", help="Port to listen on.")
    parser.add_option(
        "--syncdb", action="store_true",
        help="Update/create database before starting the server.")
    parser.add_option(
        "--reset-admin", action="store_true",
        help="Make sure the user 'admin' exists and uses 'admin' as password.")
    parser.add_option(
        "-s", "--settings", help="Path to the openslides configuration.")
    parser.add_option(
        "--no-reload", action="store_true",
        help="Do not reload the development server.")
    parser.add_option(
        "--version", action="store_true",
        help="Show version and exit.")

    opts, args = parser.parse_args(argv)
    if opts.version:
        print get_version()
        exit(0)
    if args:
        sys.stderr.write("This command does not take arguments!\n\n")
        parser.print_help()
        sys.exit(1)

    return opts


def main(argv=None):
    opts = process_options(argv)
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
    if port == 80:
        url = "http://%s" % addr
    else:
        url = "http://%s:%d" % (addr, port)

    # Create Database if necessary
    if not database_exists() or opts.syncdb:
        run_syncdb()
        set_system_url(url)
        create_or_reset_admin_user()

    # Reset Admin
    elif opts.reset_admin:
        create_or_reset_admin_user()

    # Start OpenSlides
    if opts.no_reload:
        extra_args = ['--noreload']
    else:
        extra_args = []
    start_openslides(addr, port, start_browser_url=url, extra_args=extra_args)


def create_settings(settings_path, database_path=None):
    settings_module = os.path.dirname(settings_path)

    if database_path is _portable_db_path:
        database_path = get_portable_db_path()
        dbpath_value = 'openslides.main.get_portable_db_path()'
    else:
        if database_path is None:
            database_path = get_user_data_path('openslides', 'database.sqlite')
        dbpath_value = repr(fs2unicode(database_path))

    settings_content = CONFIG_TEMPLATE % dict(
        default_key=base64.b64encode(os.urandom(KEY_LENGTH)),
        dbpath=dbpath_value)

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
    os.environ[django.conf.ENVIRONMENT_VARIABLE] = '%s' % settings_module_name


def detect_listen_opts(address, port):
    if address is None:
        try:
            address = socket.gethostbyname(socket.gethostname())
        except socket.error:
            address = "127.0.0.1"

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
    execute_from_command_line(["", "loaddata", "groups_de"])


def set_system_url(url):
    # can't be imported in global scope as it already requires
    # the settings module during import
    from openslides.config.models import config

    key = "participant_pdf_system_url"
    if key in config:
        return
    config[key] = url


def create_or_reset_admin_user():
    # can't be imported in global scope as it already requires
    # the settings module during import
    from openslides.participant.models import User
    try:
        admin = User.objects.get(username="admin")
        print("Password for user admin was reset to 'admin'")
    except User.DoesNotExist:
        admin = User()
        admin.username = 'admin'
        admin.last_name = 'Administrator'
        print("Created default admin user")

    admin.is_superuser = True
    admin.default_password = 'admin'
    admin.set_password(admin.default_password)
    admin.save()


def start_openslides(addr, port, start_browser_url=None, extra_args=[]):
    argv = ["", "runserver", '--noreload'] + extra_args

    argv.append("%s:%d" % (addr, port))

    if start_browser_url:
        start_browser(start_browser_url)
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


def get_portable_path(*args):
    # NOTE: sys.executable will be the path to openslides.exe
    #       since it is essentially a small wrapper that embeds the
    #       python interpreter

    exename = os.path.basename(sys.executable).lower()
    if exename != "openslides.exe":
        raise Exception(
            "Cannot determine portable path when "
            "not running as portable")

    portable_dir = fs2unicode(os.path.dirname(os.path.abspath(sys.executable)))
    return os.path.join(portable_dir, *args)


def get_portable_db_path():
    return get_portable_path('openslides', 'database.sqlite')


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
    main()
