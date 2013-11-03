# -*- coding: utf-8 -*-

from django.dispatch import Signal
from django.template import RequestContext
from django.template.loader import render_to_string
from django.utils.datastructures import SortedDict

from openslides.utils.exceptions import OpenSlidesError

receive_widgets = Signal(providing_args=['request'])


class Widget(object):
    """
    Class for a widget for the dashboard.
    """
    def __init__(self, name, display_name=None, html=None, template=None,
                 context=None, request=None, permission_required=None,
                 default_column=1, default_weight=0):
        self.name = name
        if display_name is None:
            self.display_name = name.capitalize()
        else:
            self.display_name = display_name
        if html is not None:
            self.html = html
        elif template is not None and request is not None:
            self.html = render_to_string(
                template_name=template,
                dictionary=context or {},
                context_instance=RequestContext(request))
        else:
            raise OpenSlidesError('A widget must have either a html argument or a template and a request argument.')
        self.permission_required = permission_required
        self.default_column = default_column
        self.default_weight = default_weight

    def get_name(self):
        """
        Returns the lower case of the widget name.
        """
        return self.name.lower()

    def get_html(self):
        """
        Returns the html code of the widget.
        """
        return self.html

    def get_title(self):
        """
        Returns the title of the widget.
        """
        return self.display_name

    def __repr__(self):
        return repr(self.display_name)

    def __unicode__(self):
        return unicode(self.display_name)


def get_all_widgets(request, session=False):
    """
    Collects the widgets from all apps via signal and returns them as sorted
    dictionary.

    The session flag decides whether to return only the widgets which are
    active, that means that they are mentioned in the session.
    """
    all_widgets = [widget for function, widget in receive_widgets.send(sender='get_all_widgets', request=request) if widget]
    all_widgets.sort(key=lambda widget: widget.default_weight)
    session_widgets = request.session.get('widgets', {})
    widgets = SortedDict()
    for widget in all_widgets:
        if (widget.permission_required is None or
                request.user.has_perm(widget.permission_required)):
            if not session or session_widgets.get(widget.get_name(), True):
                widgets[widget.get_name()] = widget  # TODO: Check whether using only lowercase names is necessary
    return widgets
