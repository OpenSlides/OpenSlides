# -*- coding: utf-8 -*-

from datetime import datetime

from django.conf import settings
from django.contrib.sessions.models import Session
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

        session_key = info.get_cookie(settings.SESSION_COOKIE_NAME).value
        session = Session.objects.get(session_key=session_key)
        try:
            self.user = User.objects.get(pk=session.get_decoded().get('_auth_user_id'))
        except User.DoesNotExist:
            return_value = False
        else:
            # TODO: Use correct permission here
            if self.user.has_perm('projector.can_manage_projector'):
                self.clients.add(self)
                return_value = True
            else:
                return_value = False
        return return_value

    def on_message(self, message):
        """
        Sends the given message to all clients.

        Also appends the message to the cache and removes old messages if there
        are more than 100.
        """
        # TODO: Use correct permission here
        if self.user.has_perm('projector.can_manage_projector') and message:
            message_object = ChatMessage(person=self.user, message=message)
            chat_messages.append(message_object)
            if len(chat_messages) > 100:
                chat_messages.pop(0)
            self.broadcast(
                self.clients,
                '%s %s' % (message_object.html_time_and_person(),
                           message_object.message))

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

    def html_time_and_person(self):
        """
        Returns a styled prefix for each message using span and small html tags.
        """
        return '<span style="color:%(color)s;">%(person)s <small class="grey">%(time)s</small>:</span>' % {
            'color': 'rgb(%d,%d,%d)' % self.color,
            'person': self.person.clean_name,
            'time': self.time.strftime('%H:%M')}


chat_messages = []
"""
Cache with all messages during livetime of the server.
"""


def chat_messages_context_processor(request):
    """
    Adds all chat messages to the request context as template context processor.
    """
    if True:  # TODO: Add permission check here
        value = chat_messages
    else:
        value = None
    return {'chat_messages': value}
