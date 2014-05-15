# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse
from django.dispatch import Signal
from django.template import RequestContext
from django.template.loader import render_to_string

from .dispatch import SignalConnectMetaClass


class Widget(object):
    """
    Base class for a widget for the dashboard.

    Every app which wants to add widgets to the dashboard has to create a
    widget class subclassing from this base class. The name attribute has to
    be set. It has to be unique. The __metaclass__ attribute
    (SignalConnectMetaClass) does the rest of the magic.

    For the appearance of the widget there are some attributes and methods
    like verbose_name, required_permission, default_column, default_weight,
    default_active, template_name, context, icon_css_class,
    more_link_pattern_name, stylesheets, javascript_files,
    get_verbose_name, check_permission, get_html, get_context_data,
    get_icon_css_class, get_url_for_more, get_stylesheets and
    get_javascript_files. Most of them are optional.
    """
    __metaclass__ = SignalConnectMetaClass
    signal = Signal(providing_args=['request'])
    name = None
    verbose_name = None
    required_permission = None
    default_column = 1
    default_weight = 0
    default_active = True
    template_name = None
    context = None
    icon_css_class = None
    more_link_pattern_name = None
    stylesheets = None
    javascript_files = None

    def __init__(self, sender, request, **kwargs):
        """
        Initializes the widget instance. This is done when the signal is sent.

        Only the required request argument is used. Because of Django's signal
        API, we have to take also a sender argument and wildcard keyword
        arguments. But they are not used here.
        """
        self.request = request

    def __repr__(self):
        return repr(self.get_verbose_name())

    def __unicode__(self):
        return unicode(self.get_verbose_name())

    @classmethod
    def get_dispatch_uid(cls):
        """
        Returns the name as a unique string for each class. Returns None for
        the base class so it will not be connected to the signal.

        This does not follow the example implementation of
        SignalConnectMetaClass, so take care here.
        """
        return cls.name

    def get_verbose_name(self):
        """
        Returns a human readable name of the widget.
        """
        return self.verbose_name or self.name.capitalize()

    def check_permission(self):
        """
        Returns True if the request user is allowed to see the widget.
        """
        return self.required_permission is None or self.request.user.has_perm(self.required_permission)

    def is_active(self):
        """
        Returns True if the widget is active to be displayed.
        """
        session_widgets = self.request.session.get('widgets', {})
        return session_widgets.get(self.name, self.default_active)

    def get_html(self):
        """
        Returns the html code of the widget.

        This method also adds the widget itself to the context.
        """
        if self.template_name is not None:
            html = render_to_string(
                template_name=self.template_name,
                dictionary=self.get_context_data(widget=self),
                context_instance=RequestContext(self.request))
        else:
            raise NotImplementedError('A widget class must define either a get_html '
                                      'method or have template_name argument.')
        return html

    def get_context_data(self, **context):
        """
        Returns the context data for the widget template.
        """
        return_context = self.context or {}
        return_context.update(context)
        return return_context

    def get_icon_css_class(self):
        """
        Returns the css class name of the icon.
        """
        return self.icon_css_class or 'icon-%s' % self.name

    def get_url_for_more(self):
        """
        Returns the url for the link 'More ...' in the base template.
        """
        if self.more_link_pattern_name is not None:
            url = reverse(self.more_link_pattern_name)
        else:
            url = None
        return url

    def get_stylesheets(self):
        """
        Returns an interable of stylesheets to be loaded.
        """
        return iter(self.stylesheets or [])

    def get_javascript_files(self):
        """
        Returns an interable of javascript files to be loaded.
        """
        return iter(self.javascript_files or [])
