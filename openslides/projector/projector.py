#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.projector
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Slide functions for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from time import time

from django.dispatch import receiver
from django.template.loader import render_to_string

from openslides.config.api import config
from django.template import RequestContext
from openslides.utils.exceptions import OpenSlidesError


SLIDE = {}


class SlideMixin(object):
    """
    A Mixin for a Django-Model, for making the model a slide.
    """

    def slide(self):
        """
        Return a map with all Data for the Slide.
        """
        return {
            'slide': self,
            'title': 'dummy-title',
            'template': 'projector/default.html',
        }

    @property
    def sid(self):
        """
        Return the sid from this Slide
        """
        return "%s-%d" % (self.prefix, self.id)

    @property
    def active(self):
        """
        Return True, if the the slide is the active slide.
        """
        if self.id is None:
            return False
        from openslides.projector.api import get_active_slide
        return get_active_slide(only_sid=True) == self.sid

    def set_active(self):
        """
        Appoint this item as the active slide.
        """
        from openslides.projector.api import set_active_slide
        set_active_slide(self.sid)

    def save(self, *args, **kwargs):
        if self.active:
            from api import clear_projector_cache
            clear_projector_cache()
        return super(SlideMixin, self).save(*args, **kwargs)


class Slide(object):
    """
    Represents a Slide for the projector. Can be a modelinstanz, or a function.
    """
    def __init__(self, model_slide=False, func=None, model=None, category=None,
                 key=None, model_name='', control_template='', weight=0, name=''):
        """
        model_slide: Boolean if the value is a Model.
        func: The function to call. Only if modelslide is False.
        model: The model. Only if modelslide is True.
        model_name: The name shown for the model.
        category: The category to show this Slide.
        key: the key in the slide object to find itself.
        """
        self.model_slide = model_slide
        self.func = func
        self.model = model
        self.model_name = model_name
        self.category = category
        self.key = key
        self.control_template = control_template
        self.weight = weight
        self.name = name

    @property
    def active(self):
        """
        Return True if the Slide is active, else: False.
        """
        from api import get_active_slide
        return get_active_slide(True) == self.key

    def get_items(self):
        """
        If the Slide is a Slide from a Model, return all Objects.
        """
        try:
            return self.model.objects.all()
        except AttributeError:
            return 'No Model'


class Widget(object):
    """
    Class for a Widget for the Projector-Tab.
    """
    def __init__(self, request, name, html=None, template=None, context={},
                 permission_required=None, display_name=None, default_column=1):
        self.name = name
        if display_name is None:
            self.display_name = name.capitalize()
        else:
            self.display_name = display_name

        if html is not None:
            self.html = html
        elif template is not None:
            self.html = render_to_string(
                template_name=template,
                dictionary=context,
                context_instance=RequestContext(request))
        else:
            raise OpenSlidesError('A Widget must have either a html or a template argument.')

        self.permission_required = permission_required
        self.default_column = default_column

    def get_name(self):
        return self.name.lower()

    def get_html(self):
        return self.html

    def get_title(self):
        return self.display_name

    def __repr__(self):
        return unicode(self.display_name)

    def __unicode__(self):
        return unicode(self.display_name)


class Overlay(object):
    """
    Represents an overlay which can be seen on the projector.
    """

    def __init__(self, name, get_widget_html, get_projector_html):
        self.name = name
        self.widget_html_callback = get_widget_html
        self.projector_html_callback = get_projector_html

    def get_widget_html(self):
        return self.widget_html_callback()

    def get_projector_html(self):
        try:
            return self._projector_html
        except AttributeError:
            self._projector_html = self.projector_html_callback()
            return self.get_projector_html()

    def is_active(self):
        return self.name in config['projector_active_overlays']

    def show_on_projector(self):
        return self.is_active() and self.get_projector_html() is not None
