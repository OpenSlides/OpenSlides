#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.api
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.template.loader import render_to_string

from openslides.config.models import config
from openslides.projector.projector import SLIDE, Slide, Widget


def split_sid(sid):
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
    it raise an error

    if only_sid is True, returns only the id of this item. Returns None if not Item
    is active. Does not Raise Item.DoesNotExist
    """
    sid = config["presentation"]

    if only_sid:
        return sid
    return get_slide_from_sid(sid)


def set_active_slide(sid):
    config["presentation"] = sid


def register_slidemodel(model, model_name=None, control_template=None, weight=0):
    #TODO: Warn if there already is a slide with this prefix
    if model_name is None:
        model_name = model.prefix

    if control_template is None:
        control_template = 'projector/default_control_slidemodel.html'

    category = model.__module__.split('.')[0]
    SLIDE[model_name] = Slide(
        model_slide=True,
        model=model,
        category=category,
        key=model.prefix,
        model_name=model_name,
        control_template=control_template,
        weight=weight,
    )


def register_slidefunc(key, func, control_template=None, weight=0, name=''):
    #TODO: Warn if there already is a slide with this prefix
    if control_template is None:
        control_template = 'projector/default_control_slidefunc.html'
    category = func.__module__.split('.')[0]
    SLIDE[key] = Slide(
        model_slide=False,
        func=func,
        category=category,
        key=key,
        control_template=control_template,
        weight=weight,
        name=name,
    )


def projector_message_set(message, sid=None):
    from models import ProjectorOverlay
    config['projector_message'] = message
    try:
        overlay = ProjectorOverlay.objects.get(def_name='Message')
    except ProjectorOverlay.DoesNotExist:
        overlay = ProjectorOverlay(def_name='Message', active=True)
    print "hier mal ein ", sid
    overlay.sid=sid
    overlay.save()


def projector_message_delete():
    config['projector_message'] = ''
