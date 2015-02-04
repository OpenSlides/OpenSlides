import json
import os
import re
import posixpath
from urllib.parse import unquote, urlparse

from django.conf import settings
from django.core.wsgi import get_wsgi_application
from sockjs.tornado import SockJSRouter, SockJSConnection
from tornado.httpserver import HTTPServer
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from tornado.httputil import HTTPHeaders
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
    """
    Handels static data by using the django finders.

    Only needed in the "small" version with tornado as wsgi server.
    """

    def initialize(self):
        """Overwrite some attributes."""
        # NOTE: root is never actually used and default_filename is not
        #       supported (must always be None)
        self.root = ''
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


class OpenSlidesSockJSConnection(SockJSConnection):
    """
    SockJS connection for OpenSlides.
    """
    waiters = set()

    def on_open(self, request_info):
        OpenSlidesSockJSConnection.waiters.add(self)
        self.request_info = request_info

    def on_close(self):
        OpenSlidesSockJSConnection.waiters.remove(self)

    def handle_rest_request(self, response):
        """
        Sends data to the client of the connection instance.

        This method is called after succesful response of AsyncHTTPClient().
        See send_object().
        """
        # TODO: Update cookies of the client.
        path = urlparse(response.request.url).path
        match = re.match(r'^/api/(?P<name>[\w/]+)/(?P<id>\d+)/$', path)
        if match:
            name = match.group('name')
            data = {
                'url': response.request.url,
                'name': name,
                'data': json.loads(response.body.decode())}
            # TODO: Check and handle other status codes.
            if response.code == 200:
                self.send(data)

    @classmethod
    def send_object(cls, object_url):
        """
        Sends an OpenSlides object to all connected clients.

        First, receive the object from the OpenSlides REST api using the given
        object_url.
        """
        for waiter in cls.waiters:
            http_client = AsyncHTTPClient()

            # TODO: read to python Morselcookies and why "set-Cookie" does not work
            headers = HTTPHeaders()
            request_cookies = waiter.request_info.cookies.values()
            cookie_value = ';'.join("%s=%s" % (cookie.key, cookie.value)
                                    for cookie in request_cookies)
            headers.parse_line("Cookie: %s" % cookie_value)

            # TODO: Use host and port as given in the start script
            wsgi_network_location = settings.OPENSLIDES_WSGI_NETWORK_LOCATION or 'http://localhost:8000'

            request = HTTPRequest(
                url=''.join((wsgi_network_location, object_url)),
                headers=headers,
                decompress_response=False)

            # TODO: use proxy_host as header from waiter.request_info
            http_client.fetch(request, waiter.handle_rest_request)


def run_tornado(addr, port, *args, **kwargs):
    """
    Starts the tornado webserver as wsgi server for OpenSlides.

    It runs in one thread.
    """
    # Don't try to read the command line args from openslides
    parse_command_line(args=[])

    # Setup WSGIContainer
    app = WSGIContainer(get_wsgi_application())

    # Collect urls
    from openslides.core.chatbox import ChatboxSocketHandler
    chatbox_socket_js_router = SockJSRouter(ChatboxSocketHandler, '/core/chatbox')
    sock_js_router = SockJSRouter(OpenSlidesSockJSConnection, '/sockjs')
    other_urls = [
        (r"%s(.*)" % settings.STATIC_URL, DjangoStaticFileHandler),
        (r'%s(.*)' % settings.MEDIA_URL, StaticFileHandler, {'path': settings.MEDIA_ROOT}),
        ('.*', FallbackHandler, dict(fallback=app))]

    # Start the application
    debug = settings.DEBUG
    tornado_app = Application(sock_js_router.urls + chatbox_socket_js_router.urls + other_urls, autoreload=debug, debug=debug)
    server = HTTPServer(tornado_app)
    server.listen(port=port, address=addr)
    IOLoop.instance().start()


def inform_changed_data(*args):
    """
    Informs all users about changed data.

    The arguments are Django/OpenSlides models.
    """
    rest_urls = set()
    for instance in args:
        try:
            rest_urls.add(instance.get_root_rest_url())
        except AttributeError:
            # Instance has no method get_root_rest_url. Just skip it.
            pass

    if settings.USE_TORNADO_AS_WSGI_SERVER:
        for url in rest_urls:
            OpenSlidesSockJSConnection.send_object(url)
    else:
        pass
        # TODO: Implement big varainte with Apache or Nginx as wsgi webserver.


def inform_changed_data_receiver(sender, instance, **kwargs):
    """
    Receiver for the inform_changed_data function to use in a signal.
    """
    inform_changed_data(instance)
