#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.tornado_webserver
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import sys
import posixpath
from urllib import unquote

from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, Application, StaticFileHandler
from tornado.wsgi import WSGIContainer
from tornado.options import options, parse_command_line

from django.core.handlers.wsgi import WSGIHandler as Django_WSGIHandler
from django.conf import settings
from django.utils.translation import ugettext as _


class DjangoStaticFileHandler(StaticFileHandler):
    """Handels static data by using the django finders."""

    def initialize(self):
        """Overwrite some attributes."""
        self.root = ''
        self.default_filename = None

    def get(self, path, include_body=True):
        from django.contrib.staticfiles import finders
        normalized_path = posixpath.normpath(unquote(path)).lstrip('/')
        absolute_path = finders.find(normalized_path)
        return super(DjangoStaticFileHandler, self).get(absolute_path, include_body)


def run_tornado(addr, port, reload=False):
    # Don't try to read the command line args from openslides
    parse_command_line(args=[])

    # Print listening address and port to command line
    if addr == '0.0.0.0':
        url_string = _("the machine's local ip address")
    else:
        url_string = 'http://%s:%s' % (addr, port)
    print _("Starting OpenSlides' tornado webserver listening to %(url_string)s") % {'url_string': url_string}

    # Start the application
    app = WSGIContainer(Django_WSGIHandler())
    tornado_app = Application([
        (r"%s(.*)" % settings.STATIC_URL, DjangoStaticFileHandler),
        (r'%s(.*)' % settings.MEDIA_URL, StaticFileHandler, {'path': settings.MEDIA_ROOT}),
        ('.*', FallbackHandler, dict(fallback=app))], debug=reload)

    server = HTTPServer(tornado_app)
    server.listen(port=port,
                  address=addr)
    IOLoop.instance().start()
