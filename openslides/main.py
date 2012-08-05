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

import os
import sys
import optparse
import socket
import time
import threading
import base64
import webbrowser
from contextlib import nested

import django.conf
from django.core.management import execute_from_command_line
from django.utils.crypto import get_random_string

import openslides

CONFIG_TEMPLATE = """
from openslides.openslides_settings import *

# Use 'DEBUG = True' to get more details for server errors
# (Default for relaeses: 'False')
DEBUG = False
TEMPLATE_DEBUG = DEBUG

DBPATH = %(dbpath)r

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

def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]

    parser = optparse.OptionParser(
        description="Run openslides using django's builtin webserver")
    parser.add_option("-a", "--address", help="IP Address to listen on")
    parser.add_option("-p", "--port", type="int", help="Port to listen on")
    parser.add_option("--nothread", action="store_true",
        help="Do not use threading")
    parser.add_option("--syncdb", action="store_true",
        help="Update/create database before starting the server")
    parser.add_option("--reset-admin", action="store_true",
        help="Make sure the user 'admin' exists and uses 'admin' as password")

    opts, args = parser.parse_args(argv)
    if not args:
        main(argv + ['init', 'openslides'])
        main(argv + ['start', 'openslides'])
        return 0

    command = args[0]

    addr, port = detect_listen_opts(opts.address, opts.port)
    if port == 80:
        url = "http://%s" % (addr, )
    else:
        url = "http://%s:%d" % (addr, port)

    try:
        environment_name = args[1]
    except IndexError:
        environment_name = None

    if command == 'init':
        if check_environment(environment_name):
            print "'%s' is allready an environment" % environment_name
            return 1
        create_environment(environment_name or 'openslides', url)

    elif command == 'start':
        set_settings_environment(environment_name or os.getcwd())
        if not check_environment():
            print "'%s' is not a valid OpenSlides environment." % environment_name
            sys.exit(1)
        # NOTE: --insecure is needed so static files will be served if
        #       DEBUG is set to False
        argv = ["", "runserver", "--noreload", "--insecure"]
        if opts.nothread:
            argv.append("--nothread")

        argv.append("%s:%d" % (addr, port))

        start_browser(url)
        execute_from_command_line(argv)


def set_settings_environment(environment):
    sys.path.append(environment)
    os.environ[django.conf.ENVIRONMENT_VARIABLE] = 'settings'


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


def start_browser(url):
    browser = webbrowser.get()
    def f():
        time.sleep(1)
        browser.open(url)

    t = threading.Thread(target = f)
    t.start()


def create_environment(environment, url=None):
    setting_content = CONFIG_TEMPLATE % dict(
        default_key=base64.b64encode(os.urandom(KEY_LENGTH)),
        dbpath=os.path.join(os.path.abspath(environment), 'database.db'))

    dirname = environment
    if dirname and not os.path.exists(dirname):
        os.makedirs(dirname)

    settings = os.path.join(environment, 'settings.py')
    if not os.path.exists(settings):
        with open(settings, 'w') as fp:
            fp.write(setting_content)

    set_settings_environment(environment)

    run_syncdb(url)
    create_or_reset_admin_user()


def run_syncdb(url=None):
    # now initialize the database
    argv = ["", "syncdb", "--noinput"]
    execute_from_command_line(argv)

    if url is not None:
        set_system_url(url)


def check_environment(environment=None):
    if environment is not None:
        set_settings_environment(environment)
    try:
        import settings
    except ImportError:
        return False
    if not check_database():
        return False
    return True


def check_database():
    """Detect if database was deleted and recreate if necessary"""
    # can't be imported in global scope as they already require
    # the settings module during import
    from django.db import DatabaseError
    from django.contrib.auth.models import User

    try:
        User.objects.count()
    except DatabaseError:
        return False
    else:
        return True


def create_or_reset_admin_user():
    # can't be imported in global scope as it already requires
    # the settings module during import
    from django.contrib.auth.models import User
    from openslides.config.models import config
    try:
        obj = User.objects.get(username = "admin")
    except User.DoesNotExist:
        User.objects.create_superuser(
            username="admin",
            password="admin",
            email="admin@example.com")
        config['admin_password'] = "admin"
        print("Created default admin user")
        return

    print("Password for user admin was reset to 'admin'")
    obj.set_password("admin")
    obj.save()


def set_system_url(url):
    # can't be imported in global scope as it already requires
    # the settings module during import
    from openslides.config.models import config

    key = "participant_pdf_system_url"
    if key in config:
        return
    config[key] = url


if __name__ == "__main__":
    main()
