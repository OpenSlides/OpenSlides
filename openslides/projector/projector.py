# -*- coding: utf-8 -*-

import warnings


from openslides.config.api import config

from .exceptions import ProjectorExceptionWarning


class Overlay(object):
    """
    Represents an overlay which can be seen on the projector.
    """

    def __init__(self, name, get_widget_html, get_projector_html,
                 get_javascript=None, allways_active=False):
        self.name = name
        self.widget_html_callback = get_widget_html
        self.projector_html_callback = get_projector_html
        self.javascript_callback = get_javascript
        self.allways_active = allways_active

    def __repr__(self):
        return self.name

    def get_widget_html(self):
        """
        Returns the html code for the overlay widget.

        Can return None, if the widget does not want to be in the widget.
        """
        value = None
        if self.widget_html_callback is not None:
            value = self.widget_html_callback()
        return value

    def get_projector_html(self):
        """
        Returns the html code for the projector.
        """
        try:
            value = self.get_html_wrapper(self.projector_html_callback())
        except Exception as exception:
            warnings.warn('%s in overlay "%s": %s'
                          % (type(exception).__name__, self, exception),
                          ProjectorExceptionWarning)
            value = ''
        return value

    def get_javascript(self):
        """
        Returns the java-script code for the projector.
        """
        if self.javascript_callback is None:
            value = {}
        else:
            value = self.javascript_callback()
        return value

    def get_html_wrapper(self, inner_html):
        """
        Returns the inner_html wrapped in a div.

        The html-id of the div is "overlay_OVERLAYNAME"
        """
        full_html = ''
        if inner_html is not None:
            full_html = '<div id="overlay_%s">%s</div>' % (self.name, inner_html)
        return full_html

    def is_active(self):
        """
        Returns True if the overlay is activated. False in other case.
        """
        return self.allways_active or self.name in config['projector_active_overlays']

    def set_active(self, active):
        """
        Publish or depublish the overlay on the projector.

        publish, if active is true,
        depublish, if active is false.
        """
        active_overlays = set(config['projector_active_overlays'])
        if active:
            active_overlays.add(self.name)
        else:
            active_overlays.discard(self.name)
        config['projector_active_overlays'] = list(active_overlays)

    def show_on_projector(self):
        """
        Retruns True if the overlay should be shoun on the projector.
        """
        return self.is_active() and self.get_projector_html() is not None
