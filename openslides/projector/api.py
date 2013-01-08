#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.api
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf import settings
from django.core.cache import cache
from django.utils.datastructures import SortedDict
from django.utils.importlib import import_module

from openslides.config.models import config
from openslides.projector.projector import SLIDE, Slide


def split_sid(sid):
    """
    Slit a SID in the model-part and in the model-id
    """
    try:
        data = sid.split('-')
    except AttributeError:
        return None
    if len(data) == 2:
        model = data[0]
        id = data[1]
        return (model, id)
    if len(data) == 1:
        try:
            return (SLIDE[data[0]].key, None)
        except KeyError:
            return None
    return None


def get_slide_from_sid(sid, element=False):
    """
    Return the Slide for an given sid.
    If element== False, return the slide-dict,
    else, return the object.
    """
    try:
        key, id = split_sid(sid)
    except TypeError:
        return None

    if id is not None:
        try:
            object = SLIDE[key].model.objects.get(pk=id)
        except SLIDE[key].model.DoesNotExist:
            return None
        if element:
            return object
        return object.slide()
    try:
        return SLIDE[key].func()
    except KeyError:
        return None


def get_active_slide(only_sid=False):
    """
    Returns the active slide. If no slide is active, or it can not find an Item,
    return None

    if only_sid is True, returns only the id of this item. Returns None if not
    Item is active.
    """
    sid = config["presentation"]

    if only_sid:
        return sid
    return get_slide_from_sid(sid)


def set_active_slide(sid, argument=None):
    """
    Set the active Slide.
    """
    config["presentation"] = sid
    config['presentation_argument'] = argument
    clear_projector_cache()


def clear_projector_cache():
    for language, __ in settings.LANGUAGES:
        cache.delete('projector_content_' + language)
        cache.delete('projector_scrollcontent_' + language)
        cache.delete('projector_data_' + language)


def register_slidemodel(model, model_name=None, control_template=None, weight=0):
    """
    Register a Model as a slide.
    """
    # TODO: control_template should never be None
    if model_name is None:
        model_name = model.prefix

    category = model.__module__.split('.')[0]
    SLIDE[model_name] = Slide(model_slide=True, model=model, category=category,
                              key=model.prefix, model_name=model_name,
                              control_template=control_template, weight=weight)


def register_slidefunc(key, func, control_template=None, weight=0, name=''):
    """
    Register a function for as a slide.
    """
    if control_template is None:
        control_template = 'projector/default_control_slidefunc.html'
    category = func.__module__.split('.')[0]
    SLIDE[key] = Slide(model_slide=False, func=func, category=category,
                       key=key, control_template=control_template, weight=weight,
                       name=name,)


def projector_message_set(message, sid=None):
    """
    Set the overlay-message.
    if sid is set, only show the message on the sid-slide.
    """
    from models import ProjectorOverlay
    config['projector_message'] = message
    try:
        overlay = ProjectorOverlay.objects.get(def_name='Message')
    except ProjectorOverlay.DoesNotExist:
        overlay = ProjectorOverlay(def_name='Message', active=False)
    overlay.sid = sid
    overlay.save()


def projector_message_delete():
    """
    Delete the overlay-message.
    """
    config['projector_message'] = ''


def get_all_widgets(request, session=False):
    widgets = SortedDict()
    session_widgets = request.session.get('widgets', {})
    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module(app + '.views')
        except ImportError:
            continue
        try:
            modul_widgets = mod.get_widgets(request)
        except AttributeError:
            continue

        for widget in modul_widgets:
            if (widget.permission_required is None or
                    request.user.has_perm(widget.permission_required)):
                if not session or session_widgets.get(widget.get_name(), True):
                    widgets[widget.get_name()] = widget
    return widgets
