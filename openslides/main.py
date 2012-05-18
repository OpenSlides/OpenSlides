#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.main
    ~~~~~~~~~~~~~~~

    Main script to start and set up OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from __future__ import with_statement

import os
import sys
import optparse
import socket
import time
import threading
import webbrowser
from contextlib import nested

import django.conf
from django.core.management import execute_from_command_line
from django.utils.crypto import get_random_string

import openslides


def main(argv = None):
    if argv is None:
        argv = sys.argv[1:]

    parser = optparse.OptionParser(description = "Run openslides using "
        "django's builtin webserver")
    parser.add_option("-a", "--address", help = "IP Address to listen on")
    parser.add_option("-p", "--port", type = "int", help = "Port to listen on")
    parser.add_option("--nothread", action = "store_true",
        help = "Do not use threading")
    parser.add_option("--syncdb", action = "store_true",
        help = "Update/create database before starting the server")
    parser.add_option("--reset-admin", action = "store_true",
        help = "Make sure the user 'admin' exists and uses 'admin' as password")

    opts, args = parser.parse_args(argv)
    if args:
        sys.stderr.write("This command does not take arguments!\n\n")
        parser.print_help()
        sys.exit(1)

    if not prepare_openslides(opts.syncdb):
        sys.exit(1)

    if opts.reset_admin:
        create_or_reset_admin_user()

    # NOTE: --insecure is needed so static files will be served if 
    #       DEBUG is set to False
    argv = ["", "runserver", "--noreload", "--insecure"]
    if opts.nothread:
        argv.append("--nothread")

    addr, port = detect_listen_opts(opts.address, opts.port)
    argv.append("%s:%d" % (addr, port))

    start_browser(addr, port)
    execute_from_command_line(argv)

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

def start_browser(addr, port):
    if port == 80:
        url = "http://%s" % (addr, )
    else:
        url = "http://%s:%d" % (addr, port)
    browser = webbrowser.get()
    def f():
        time.sleep(1)
        browser.open(url)

    t = threading.Thread(target = f)
    t.start()

def prepare_openslides(always_syncdb = False):
    settings_module = os.environ.get(django.conf.ENVIRONMENT_VARIABLE)
    if not settings_module:
        os.environ[django.conf.ENVIRONMENT_VARIABLE] = "openslides.settings"
        settings_module = "openslides.settings"

    try:
        # settings is a lazy object, force the settings module
        # to be imported
        getattr(django.conf.settings, "DATABASES", None)
    except ImportError:
        pass
    else:
        if not check_database() and always_syncdb:
            run_syncdb()
        return True # import worked, settings are already configured


    if settings_module != "openslides.settings":
        sys.stderr.write("Settings module '%s' cannot be imported.\n"
            % (django.conf.ENVIRONMENT_VARIABLE, ))
        return False

    openslides_dir = os.path.dirname(openslides.__file__)
    src_fp = os.path.join(openslides_dir, "default.settings.py")
    dest_fp = os.path.join(openslides_dir, "settings.py")

    with nested(open(dest_fp, "w"), open(src_fp, "r")) as (dest, src):
        for l in src:
            if l.startswith("SECRET_KEY ="):
                l = "SECRET_KEY = '%s'\n" % (generate_secret_key(), )
            dest.write(l)


    run_syncdb()
    create_or_reset_admin_user()
    return True

def run_syncdb():
    # now initialize the database
    argv = ["", "syncdb", "--noinput"]
    execute_from_command_line(argv)

def check_database():
    """Detect if database was deleted and recreate if necessary"""
    # can't be imported in global scope as they already require
    # the settings module during import
    from django.db import DatabaseError
    from django.contrib.auth.models import User

    try:
        User.objects.count()
    except DatabaseError:
        run_syncdb()
        create_or_reset_admin_user()
        return True
    return False

def create_or_reset_admin_user():
    # can't be imported in global scope as it already requires
    # the settings module during import
    from django.contrib.auth.models import User
    try:
        obj = User.objects.get(username = "admin")
    except User.DoesNotExist:
        User.objects.create_superuser(
            username = "admin",
            password = "admin",
            email = "admin@example.com")
        print("Created default admin user")
        return

    print("Password for user admin was reset to 'admin'")
    obj.set_password("admin")
    obj.save()


def generate_secret_key():
    # same chars/ length as used in djangos startproject command
    chars = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)"
    return get_random_string(50, chars)

if __name__ == "__main__":
    main()
