#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.template
    ~~~~~~~~~~~~~~~~~~~

    Useful template functions for OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.template import loader, Context
from django.template.loader_tags import BlockNode, ExtendsNode


class Tab(object):
    def __init__(self, title='', app='', url='', permission=True, selected=False):
        self.selected = False
        self.title = title
        self.app = app
        self.permission = permission
        self.selected = selected
        self.url = url


## All following function are only needed to render a block from a template
## and could be removed, if the template worked with an include-statement instead.
## Its only used for ajax-request from the projector.

def get_template(template):
    if isinstance(template, (tuple, list)):
        return loader.select_template(template)
    return loader.get_template(template)


class BlockNotFound(Exception):
    pass


def render_template_block(template, block, context):
    """
    Renders a single block from a template. This template should have previously
    been rendered.
    """
    return render_template_block_nodelist(template.nodelist, block, context)


def render_template_block_nodelist(nodelist, block, context):
    for node in nodelist:
        if isinstance(node, BlockNode) and node.name == block:
            return node.render(context)
        for key in ('nodelist', 'nodelist_true', 'nodelist_false'):
            if hasattr(node, key):
                try:
                    return render_template_block_nodelist(
                        getattr(node, key), block, context)
                except:
                    pass
    for node in nodelist:
        if isinstance(node, ExtendsNode):
            try:
                return render_template_block(
                    node.get_parent(context), block, context)
            except BlockNotFound:
                pass
    raise BlockNotFound


def render_block_to_string(template_name, block, dictionary=None,
                           context_instance=None):
    """
    Loads the given template_name and renders the given block with the given
    dictionary as context. Returns a string.
    """
    dictionary = dictionary or {}
    t = get_template(template_name)
    if context_instance:
        context_instance.update(dictionary)
    else:
        context_instance = Context(dictionary)
    t.render(context_instance)
    return render_template_block(t, block, context_instance)
