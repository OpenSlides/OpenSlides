# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse
from django.dispatch import Signal, receiver

from .dispatch import SignalConnectMetaClass
from .signals import template_manipulation


class MainMenuEntry(object):
    """
    Base class for a main menu entry.

    Every app which wants to add entries has to create a class subclassing
    from this base class. For the appearance the verbose_name, the
    pattern_name and the icon-css-class attribute have to be set. The
    __metaclass__ attribute (SignalConnectMetaClass) does the rest of the
    magic.

    For the appearance there are some optional attributes like
    permission_required, default_weight and stylesheets.
    """
    __metaclass__ = SignalConnectMetaClass
    signal = Signal(providing_args=['request'])
    verbose_name = None
    permission_required = None
    default_weight = 0
    pattern_name = None
    icon_css_class = None
    stylesheets = None
    selected_path = None

    def __init__(self, sender, request, **kwargs):
        """
        Initializes the main menu entry instance. This is done when the signal
        is sent.

        Only the required request argument is used. Because of Django's signal
        API, we have to take also a sender argument and wildcard keyword
        arguments. But they are not used here.
        """
        self.request = request

    def __unicode__(self):
        return unicode(self.verbose_name)

    @classmethod
    def get_dispatch_uid(cls):
        """
        Returns the classname as a unique string for each class. Returns None
        for the base class so it will not be connected to the signal.
        """
        if not cls.__name__ == 'MainMenuEntry':
            return cls.__name__

    def check_permission(self):
        """
        Returns True if the request user is allowed to see the entry.
        """
        return self.permission_required is None or self.request.user.has_perm(self.permission_required)

    def get_icon_css_class(self):
        """
        Returns the css class name of the icon.
        """
        return self.icon_css_class

    def get_url(self):
        """
        Returns the url of the entry
        """
        return reverse(self.pattern_name)

    def is_active(self):
        """
        Returns True if the entry is selected at the moment.
        """
        return self.request.path.startswith(self.selected_path)

    def get_stylesheets(self):
        """
        Returns an interable of stylesheets to be loaded.
        """
        return iter(self.stylesheets or [])


def main_menu_entries(request):
    """
    Adds all main menu entries to the request context as template context
    processor.
    """
    return {'main_menu_entries': MainMenuEntry.get_all(request)}


@receiver(template_manipulation, dispatch_uid="add_main_menu_context")
def add_main_menu_context(sender, request, context, **kwargs):
    """
    Adds all stylefiles from all main menu entries to the context.
    """
    for main_menu_entry in MainMenuEntry.get_all(request):
        context['extra_stylefiles'].extend(main_menu_entry.get_stylesheets())
