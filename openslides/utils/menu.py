# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse
from django.dispatch import Signal
from django.template import RequestContext
from django.template.loader import render_to_string

from .dispatch import SignalConnectMetaClass


class Menu(object):
    """
    Base class for a main menu entry.

    Every app can create a main menu entry by subclassing this class. The
    name attribute has to be set. The __metaclass__ attribute
    (SignalConnectMetaClass) does the rest of the magic.
    """
    __metaclass__ = SignalConnectMetaClass
    signal = Signal(providing_args=['request'])
    name = None
    verbose_name = None
    permission_required = None
    defailt_weight = 0
    icon_css_class = None
    url = None

    def __init__(self, sender, request, view_class, **kwargs):
        """
        Initialize the menu instance. This is done when the signal is sent.

        Only the argument request and view_class is used. Because of Django's signal
        API, we have to take also a sender argument and wildcard keyword
        arguments. But they are not used here.

        view_class is the class of the view, on that the menu is rendered.
        """
        self.request = request
        self.view_class = view_class

    def __repr__(self):
        return repr(self.get_verbose_name())

    def __unicode__(self):
        return unicode(self.get_verbose_name())

    @classmethod
    def get_dispatch_uid(cls):
        """
        Returns the name as a unique string for each class. Returns None for
        the base class so it will not be connected to the signal.
        """
        return cls.name

    def get_verbose_name(self):
        """
        Returns a human readable name of the menu.
        """
        return self.verbose_name or self.name.capitalize()

    def check_permission(self):
        """
        Returns True if the request user is allowed to see the menu.
        """
        return self.permission_required is None or self.request.user.has_perm(self.permission_required)

    def get_default_weight(self):
        """
        Returns the default weight of the menu.
        """
        return self.default_weight

    def is_active(self):
        """
        Returns True if the menu entry is active.

        Returns True if self.view_class is in the module which name is the same
        as self.name.
        """
        return self.view_class.__module__.split('.')[-2] == self.name

    def get_icon_css_class(self):
        """
        Returns the css class name of the icon.
        """
        return self.icon_css_class or 'icon-%s' % self.name
