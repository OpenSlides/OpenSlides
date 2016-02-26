import errno
import os
import socket
import sys
from datetime import datetime

from django.conf import settings
from django.core.management.commands.runserver import Command as _Command
from django.utils import six
from django.utils.encoding import force_text, get_system_encoding

from openslides.utils.autoupdate import run_tornado


class Command(_Command):
    """
    Runserver command from django core, but starts the tornado webserver.

    Only the line to run tornado has changed from the django default
    implementation.

    The Code is from django 1.9
    """
    help = 'Starts the Tornado webserver.'

    # TODO: do not start tornado when the settings says so

    def inner_run(self, *args, **options):
        # If an exception was silenced in ManagementUtility.execute in order
        # to be raised in the child process, raise it now.
        # OPENSLIDES: We do not use the django autoreload command
        # autoreload.raise_last_exception()

        # OPENSLIDES: This line is not needed by tornado
        # threading = options.get('use_threading')
        shutdown_message = options.get('shutdown_message', '')
        quit_command = 'CTRL-BREAK' if sys.platform == 'win32' else 'CONTROL-C'

        self.stdout.write("Performing system checks...\n\n")
        self.check(display_num_errors=True)
        self.check_migrations()
        now = datetime.now().strftime('%B %d, %Y - %X')
        if six.PY2:
            now = now.decode(get_system_encoding())
        self.stdout.write(now)
        self.stdout.write((
            "Django version %(version)s, using settings %(settings)r\n"
            "Starting development server at http://%(addr)s:%(port)s/\n"
            "Quit the server with %(quit_command)s.\n"
        ) % {
            "version": self.get_version(),
            "settings": settings.SETTINGS_MODULE,
            "addr": '[%s]' % self.addr if self._raw_ipv6 else self.addr,
            "port": self.port,
            "quit_command": quit_command,
        })

        try:
            handler = self.get_handler(*args, **options)
            run_tornado(
                self.addr,
                int(self.port),
                handler,
                ipv6=self.use_ipv6)
        except socket.error as e:
            # Use helpful error messages instead of ugly tracebacks.
            ERRORS = {
                errno.EACCES: "You don't have permission to access that port.",
                errno.EADDRINUSE: "That port is already in use.",
                errno.EADDRNOTAVAIL: "That IP address can't be assigned to.",
            }
            try:
                error_text = ERRORS[e.errno]
            except KeyError:
                error_text = force_text(e)
            self.stderr.write("Error: %s" % error_text)
            # Need to use an OS exit because sys.exit doesn't work in a thread
            os._exit(1)
        except KeyboardInterrupt:
            if shutdown_message:
                self.stdout.write(shutdown_message)
            sys.exit(0)
