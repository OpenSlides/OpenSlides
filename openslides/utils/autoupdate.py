import json
import os
import posixpath
from urllib.parse import unquote
from django.conf import settings
from openslides.users.auth import get_user
from django.core.wsgi import get_wsgi_application
from django.utils.importlib import import_module
from sockjs.tornado import SockJSConnection, SockJSRouter
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from tornado.httpserver import HTTPServer
from tornado.httputil import HTTPHeaders
from tornado.ioloop import IOLoop
from tornado.options import parse_command_line
from tornado.web import (
    Application,
    FallbackHandler,
    HTTPError,
    StaticFileHandler,
)
from tornado.wsgi import WSGIContainer
from .rest_api import get_collection_and_id_from_url

RUNNING_HOST = None
RUNNING_PORT = None


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


class FakeRequest:
    pass

class OpenSlidesSockJSConnection(SockJSConnection):
    """
    SockJS connection for OpenSlides.
    """
    waiters = set()

    def on_open(self, info):
        self.waiters.add(self)
        self.connection_info = info

    def on_close(self):
        OpenSlidesSockJSConnection.waiters.remove(self)

    @classmethod
    def send_object(cls, instance, is_delete):
        """
        Sends an OpenSlides object to all connected clients (waiters).
        """
        # Send out internal HTTP request to get data from the REST api.
        for waiter in cls.waiters:
            # Read waiter's former cookies and parse session cookie to new header object.
            headers = HTTPHeaders()
            try:
                session_cookie = waiter.connection_info.cookies[settings.SESSION_COOKIE_NAME]
                engine = import_module(settings.SESSION_ENGINE)
                session = engine.SessionStore(session_cookie)

                request = FakeRequest()
                request.session = session

                user = get_user(request)
                serializer_class = instance.access_permissions.get_serializer_class(user)
                serialized_instance_data = serializer_class(instance).data

                data = {
                    'url': "foobar",
                    'status_code': 404 if is_delete else 200,
                    'collection': instance.get_collection_name(),
                    'id': instance.id,
                    'data': serialized_instance_data}
                waiter.send(data)
            except KeyError:
                # There is no session cookie
                pass
            else:
                headers.add('Cookie', '%s=%s' % (settings.SESSION_COOKIE_NAME, session_cookie.value))




def run_tornado(addr, port, *args, **kwargs):
    """
    Starts the tornado webserver as wsgi server for OpenSlides.

    It runs in one thread.
    """
    # Save the port and the addr in a global var
    global RUNNING_HOST, RUNNING_PORT
    RUNNING_HOST = addr
    RUNNING_PORT = port

    # Don't try to read the command line args from openslides
    parse_command_line(args=[])

    # Setup WSGIContainer
    app = WSGIContainer(get_wsgi_application())

    # Collect urls
    sock_js_router = SockJSRouter(OpenSlidesSockJSConnection, '/sockjs')
    other_urls = [
        (r'%s(.*)' % settings.STATIC_URL, DjangoStaticFileHandler),
        (r'%s(.*)' % settings.MEDIA_URL, StaticFileHandler, {'path': settings.MEDIA_ROOT}),
        ('.*', FallbackHandler, dict(fallback=app))]

    # Start the application
    debug = settings.DEBUG
    tornado_app = Application(sock_js_router.urls + other_urls, autoreload=debug, debug=debug)
    server = HTTPServer(tornado_app)
    server.listen(port=port, address=addr)
    IOLoop.instance().start()

    # Reset the global vars
    RUNNING_HOST = None
    RUNNING_PORT = None


def inform_changed_data(is_delete, *args):
    """
    Informs all users about changed data.

    The arguments are Django/OpenSlides models.
    """
    root_instances = set()
    for instance in args:
        try:
            root_instances.add(instance.get_root_rest_element())
        except AttributeError:
            # Instance has no method get_root_rest_url. Just skip it.
            pass

    if settings.USE_TORNADO_AS_WSGI_SERVER:
        for root_instance in root_instances:
            OpenSlidesSockJSConnection.send_object(root_instance, is_delete)
    else:
        pass
        # TODO: Implement big varainte with Apache or Nginx as wsgi webserver.


def inform_changed_data_receiver(sender, instance, **kwargs):
    """
    Receiver for the inform_changed_data function to use in a signal.
    """
    inform_changed_data(False, instance)


def inform_deleted_data_receiver(sender, instance, **kwargs):
    """
    Receiver for the inform_changed_data function to use in a signal.
    """
    inform_changed_data(True, instance)
