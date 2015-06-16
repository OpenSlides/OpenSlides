import errno
import socket
import sys
from datetime import datetime

from django.core.exceptions import ImproperlyConfigured
from django.core.management.commands.runserver import Command as _Command
from django.utils import translation
from django.utils.encoding import force_text

from openslides.utils.autoupdate import run_tornado


class Command(_Command):
    """
    Runserver command from django core, but starts the tornado webserver.

    Only the line to run tornado has changed from the django default
    implementation.
    """
    # TODO: do not start tornado when the settings says so

    def inner_run(self, *args, **options):
        from django.conf import settings
        # From the base class:
        self.stdout.write("Performing system checks...\n\n")
        self.validate(display_num_errors=True)

        try:
            self.check_migrations()
        except ImproperlyConfigured:
            pass

        now = datetime.now().strftime('%B %d, %Y - %X')

        shutdown_message = options.get('shutdown_message', '')
        quit_command = 'CTRL-BREAK' if sys.platform == 'win32' else 'CONTROL-C'

        self.stdout.write((
            "%(started_at)s\n"
            "Django version %(version)s, using settings %(settings)r\n"
            "Starting development server at http://%(addr)s:%(port)s/\n"
            "Quit the server with %(quit_command)s.\n"
            ) % {
            "started_at": now,
            "version": self.get_version(),
            "settings": settings.SETTINGS_MODULE,
            "addr": '[%s]' % self.addr if self._raw_ipv6 else self.addr,
            "port": self.port,
            "quit_command": quit_command,
            })

        translation.activate(settings.LANGUAGE_CODE)

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
                errno.EADDRNOTAVAIL: "That IP address can't be assigned-to.",
            }
            try:
                error_text = ERRORS[e.errno]
            except KeyError:
                error_text = force_text(e)
                self.stderr.write("Error: %s" % error_text)
                sys.exit(0)
            except KeyboardInterrupt:
                if shutdown_message:
                    self.stdout.write(shutdown_message)
                    sys.exit(0)
