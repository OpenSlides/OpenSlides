# -*- coding: utf-8 -*-

from django.dispatch import Signal
from django.template import RequestContext
from django.template.loader import render_to_string
from django.utils.datastructures import SortedDict

from openslides.utils.dispatch import SignalConnectMetaClass

receive_widgets = Signal(providing_args=['request'])


class Widget(object):
    """
    Base class for a widget for the dashboard.

    Every app which wants to add a widget to the dashboard has to create a
    widget class subclassing from this base class. The name attribute has to
    be set. The __metaclass__ attribute does the rest of the magic.

    For the appearance of the widget there are some more attributes like
    display_name, permission_required, default_column, default_weight,
    template_name and context.
    """
    __metaclass__ = SignalConnectMetaClass
    name = None
    receiver = receive_widgets
    display_name = None
    permission_required = None
    default_column = 1
    default_weight = 0
    template_name = None
    context = None

    def __init__(self, sender, request, **kwargs):
        """
        Initialize the widget instance. This is done when the signal
        receive_widgets is sent.
        """
        self.request = request

    def __repr__(self):
        return repr(self.get_display_name())

    def __unicode__(self):
        return unicode(self.get_display_name())

    @classmethod
    def get_dispatch_uid(cls):
        """
        Returns a unique string for each class.
        """
        if cls.name is None:
            dispatch_uid = None
        else:
            dispatch_uid = 'Widget %s' % cls.name
        return dispatch_uid

    def get_display_name(self):
        """
        Returns a human readable name of the widget.
        """
        return self.display_name or self.name.capitalize()

    def get_lower_name(self):
        """
        Returns the lower case of the widget name.
        """
        return self.name.lower()

    def is_shown(self):
        """
        Returns True if the request.user is allowed to see the widget.
        """
        return self.permission_required is None or self.request.user.has_perm(self.permission_required)

    def get_html(self):
        """
        Returns the html code of the widget.
        """
        if self.template_name is not None:
            html = render_to_string(
                template_name=self.template_name,
                dictionary=self.get_context(),
                context_instance=RequestContext(self.request))
        else:
            raise NotImplementedError('A widget class must define either a get_html method '
                                      'or have template_name argument.')
        return html

    def get_context(self):
        """
        Returns the context for the widget template.
        """
        return self.context or {}


def get_all_widgets(request, session=False):
    """
    Collects the widgets from all apps via signal and returns them as sorted
    dictionary.

    The session flag decides whether to return only the widgets which are
    active, that means that they are mentioned in the session.
    """
    all_widgets = [widget for function, widget in receive_widgets.send(sender='get_all_widgets', request=request) if widget.is_shown()]
    all_widgets.sort(key=lambda widget: widget.default_weight)
    session_widgets = request.session.get('widgets', {})
    widgets = SortedDict()
    for widget in all_widgets:
        if not session or session_widgets.get(widget.get_lower_name(), True):
            widgets[widget.get_lower_name()] = widget
    return widgets
