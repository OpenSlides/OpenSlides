# -*- coding: utf-8 -*-

import os
import posixpath
from urllib import unquote

from django.conf import settings
from django.core.handlers.wsgi import WSGIHandler as Django_WSGIHandler
from django.utils.translation import ugettext as _
from sockjs.tornado import SockJSRouter, SockJSConnection
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import parse_command_line
from tornado.web import (
    Application,
    FallbackHandler,
    StaticFileHandler,
    HTTPError
)
from tornado.wsgi import WSGIContainer


class DjangoStaticFileHandler(StaticFileHandler):
    """Handels static data by using the django finders."""

    def initialize(self):
        """Overwrite some attributes."""
        # NOTE: root is never actually used and default_filename is not
        #       supported (must always be None)
        self.root = u''
        self.default_filename = None

    @classmethod
    def get_absolute_path(cls, root, path):
        from django.contrib.staticfiles import finders
        normalized_path = posixpath.normpath(unquote(path)).lstrip('/')
        absolute_path = finders.find(normalized_path)
        return absolute_path

    def validate_absolute_path(self, root, absolute_path):
        # differences from base implementation:
        #   - we ignore self.root since our files do not necessarily have
        #     a shared root prefix
        #   - we do not handle self.default_filename (we do not use it and it
        #     does not make much sense here anyway)
        if absolute_path is None or not os.path.exists(absolute_path):
            raise HTTPError(404)
        if not os.path.isfile(absolute_path):
            raise HTTPError(403, 'The requested resource is not a file.')
        return absolute_path


class ProjectorSocketHandler(SockJSConnection):
    """
    Handels the websocket for the projector.
    """
    waiters = set()

    def on_open(self, info):
        ProjectorSocketHandler.waiters.add(self)

    def on_close(self):
        ProjectorSocketHandler.waiters.remove(self)

    @classmethod
    def send_updates(cls, data):
        for waiter in cls.waiters:
            waiter.send(data)


def run_tornado(addr, port):
    # Don't try to read the command line args from openslides
    parse_command_line(args=[])

    # Print listening address and port to command line
    if addr == '0.0.0.0':
        url_string = _("the machine's local ip address")
    else:
        url_string = 'http://%s:%s' % (addr, port)
    print _("Starting OpenSlides' tornado webserver listening to %(url_string)s") % {'url_string': url_string}

    # Setup WSGIContainer
    app = WSGIContainer(Django_WSGIHandler())

    # Collect urls
    projectpr_socket_js_router = SockJSRouter(ProjectorSocketHandler, '/projector/socket')
    from openslides.core.chatbox import ChatboxSocketHandler
    chatbox_socket_js_router = SockJSRouter(ChatboxSocketHandler, '/core/chatbox')
    other_urls = [
        (r"%s(.*)" % settings.STATIC_URL, DjangoStaticFileHandler),
        (r'%s(.*)' % settings.MEDIA_URL, StaticFileHandler, {'path': settings.MEDIA_ROOT}),
        ('.*', FallbackHandler, dict(fallback=app))]

    # Start the application
    debug = settings.DEBUG
    tornado_app = Application(projectpr_socket_js_router.urls + chatbox_socket_js_router.urls + other_urls, debug=debug)
    server = HTTPServer(tornado_app)
    server.listen(port=port, address=addr)
    IOLoop.instance().start()
