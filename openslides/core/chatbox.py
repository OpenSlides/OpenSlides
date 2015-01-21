# -*- coding: utf-8 -*-

from datetime import datetime

from django.conf import settings
from django.utils.html import urlize
from django.utils.importlib import import_module

from sockjs.tornado import SockJSConnection


class ChatboxSocketHandler(SockJSConnection):
    """
    Websocket handler for the chatbox.
    """
    clients = set()

    def on_open(self, info):
        """
        Checks connecting user and adds his client to the clients list.
        """
        from openslides.participant.models import User

        # get the session (compatible with other auth-backends)
        engine = import_module(settings.SESSION_ENGINE)
        try:
            session_key = info.get_cookie(settings.SESSION_COOKIE_NAME).value
            session_store = engine.SessionStore(session_key)
            pk = session_store.get('_auth_user_id')
        except AttributeError:
            return False

        try:
            self.user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return False

        if self.user.has_perm('core.can_use_chat'):
            self.clients.add(self)
            return True
        else:
            return False

    def on_message(self, message):
        """
        Sends the given message to all clients.

        Also appends the message to the cache and removes old messages if there
        are more than 100.
        """
        if self.user.has_perm('core.can_use_chat') and message:
            message_object = ChatMessage(person=self.user, message=message)
            chat_messages.append(message_object)
            if len(chat_messages) > 100:
                chat_messages.pop(0)
            self.broadcast(
                self.clients,
                '%s %s %s' % (message_object.html_time(),
                              message_object.html_person(),
                              urlize(message_object.message)))

    def on_close(self):
        """
        Removes client from the clients list.
        """
        self.clients.remove(self)


class ChatMessage(object):
    """
    Class for all chat messages. They are stored in the chat_messages object.

    The argument person has to be a Person object, the argument message has to
    be the message as string. The argument color can be a three-tuple of RGB
    color values. Default is black (0, 0, 0).
    """
    def __init__(self, person, message, color=None):
        self.person = person
        self.message = message
        self.color = color or (0, 0, 0)
        self.time = datetime.now()

    def html_time(self):
        """
        Returns the message time in html style.
        """
        return '<small class="grey">%s</small>' % self.time.strftime('%H:%M')

    def html_person(self):
        """
        Returns the message sender name in html style.
        """
        return "<span style='color:%(color)s;'>%(person)s:</span>" % {
            'color': 'rgb(%d,%d,%d)' % self.color,
            'person': self.person.clean_name}


chat_messages = []
"""
Cache with all messages during livetime of the server.
"""


def chat_messages_context_processor(request):
    """
    Adds all chat messages to the request context as template context processor.
    Returns None if the request user has no permission to use the chat.
    """
    if request.user.has_perm('core.can_use_chat'):
        value = chat_messages
    else:
        value = None
    return {'chat_messages': value}
