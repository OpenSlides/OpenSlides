#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.tornado_webserver
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import posixpath
from urllib import unquote

from django.conf import settings
from django.core.handlers.wsgi import WSGIHandler as Django_WSGIHandler
from django.utils.translation import ugettext as _
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import parse_command_line
from tornado.web import Application, FallbackHandler, StaticFileHandler
from tornado.websocket import WebSocketHandler
from tornado.wsgi import WSGIContainer


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


class ProjectorSocketHandler(WebSocketHandler):
    """
    Handels the websocket for the projector.
    """
    waiters = set()

    # The following lines can be uncommented, if there are any problems with
    # websockts in iOS Safari 5.0

    ## def allow_draft76(self):
        ## # for iOS 5.0 Safari
        ## return True

    def open(self):
        ProjectorSocketHandler.waiters.add(self)

    def on_close(self):
        ProjectorSocketHandler.waiters.remove(self)

    @classmethod
    def send_updates(cls, slide):
        for waiter in cls.waiters:
            waiter.write_message(slide)


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
        (r'/projector/socket/', ProjectorSocketHandler),
        ('.*', FallbackHandler, dict(fallback=app))
    ], debug=reload)

    server = HTTPServer(tornado_app)
    server.listen(port=port,
                  address=addr)
    IOLoop.instance().start()
