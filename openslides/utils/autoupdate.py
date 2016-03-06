import json
import os
import posixpath
from importlib import import_module
from urllib.parse import unquote

from django.conf import settings
from django.core.wsgi import get_wsgi_application
from sockjs.tornado import SockJSConnection, SockJSRouter
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import parse_command_line
from tornado.web import (
    Application,
    FallbackHandler,
    HTTPError,
    StaticFileHandler,
)
from tornado.wsgi import WSGIContainer

from ..users.auth import AnonymousUser, get_user
from .access_permissions import BaseAccessPermissions

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
    def send_object(cls, json_container):
        """
        Sends an OpenSlides object to all connected clients (waiters).
        """
        # Load JSON
        container = json.loads(json_container)

        # Search our AccessPermission class.
        for access_permissions in BaseAccessPermissions.get_all():
            if access_permissions.get_dispatch_uid() == container.get('dispatch_uid'):
                break
        else:
            raise ValueError('Invalid container. A valid dispatch_uid is missing.')

        # Loop over all waiters
        for waiter in cls.waiters:
            # Read waiter's former cookies and parse session cookie to get user instance.
            try:
                session_cookie = waiter.connection_info.cookies[settings.SESSION_COOKIE_NAME]
            except KeyError:
                # There is no session cookie so use anonymous user here.
                user = AnonymousUser()
            else:
                # Get session from session store and use it to retrieve the user.
                engine = import_module(settings.SESSION_ENGINE)
                session = engine.SessionStore(session_cookie.value)
                fake_request = type('FakeRequest', (), {})()
                fake_request.session = session
                user = get_user(fake_request)

            # Two cases: models instance was changed or deleted
            if container.get('action') == 'changed':
                data = access_permissions.get_restricted_data(container.get('full_data'), user)
                if data is None:
                    # There are no data for the user so he can't see the object. Skip him.
                    break
                output = {
                    'status_code': 200,  # TODO: Refactor this. Use strings like 'change' or 'delete'.
                    'collection': container['collection_string'],
                    'id': container['rest_pk'],
                    'data': data}
            elif container.get('action') == 'deleted':
                output = {
                    'status_code': 404,  # TODO: Refactor this. Use strings like 'change' or 'delete'.
                    'collection': container['collection_string'],
                    'id': container['rest_pk']}
            else:
                raise ValueError('Invalid container. A valid action is missing.')

            # Send output to the waiter (client).
            waiter.send(output)


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

    The first argument is whether the object or the objects are deleted.
    The other arguments are the changed or deleted Django/OpenSlides model
    instances.
    """
    if settings.USE_TORNADO_AS_WSGI_SERVER:
        for instance in args:
            try:
                root_instance = instance.get_root_rest_element()
            except AttributeError:
                # Instance has no method get_root_rest_element. Just skip it.
                pass
            else:
                access_permissions = root_instance.get_access_permissions()
                container = {
                    'dispatch_uid': access_permissions.get_dispatch_uid(),
                    'collection_string': root_instance.get_collection_string(),
                    'rest_pk': root_instance.get_rest_pk()}
                if is_delete and instance == root_instance:
                    # A root instance is deleted.
                    container['action'] = 'deleted'
                else:
                    # A non root instance is deleted or any instance is just changed.
                    container['action'] = 'changed'
                    root_instance.refresh_from_db()
                    container['full_data'] = access_permissions.get_full_data(root_instance)
                OpenSlidesSockJSConnection.send_object(json.dumps(container))
    else:
        pass
        # TODO: Implement big variant with Apache or Nginx as WSGI webserver.


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
