#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.api
    ~~~~~~~~~~~~~~~~~~~~~

    Useful functions for the agenda app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.utils.translation import ugettext as _
from django.contrib import messages
from django.core.context_processors import csrf

from openslides.system.api import config_get


def get_active_item(only_id=False):
    """
    Returns the active Item. If no item is active, or it can not find an Item,
    it raise Item.DoesNotExist

    if only_id is True, returns only the id of this item. Returns None if not Item
    is active. Does not Raise Item.DoesNotExist
    """
    from agenda.models import Item
    id = config_get("presentation", None)
    if only_id:
        if id is None:
            return None
        return int(id)
    return Item.objects.get(pk=id)


def is_summary():
    """
    True, if a summery shall be displayed
    """
    from agenda.models import Item
    try:
        get_active_item()
    except Item.DoesNotExist:
        return True
    if config_get('summary', False):
        return True
    return False

def children_list(items):
    """
    Return a list for items with all childitems in the right order.
    """
    l = []
    for item in items:
        l.append(item)
        if item.children:
            l += children_list(item.children)
    return l

def gen_confirm_form_for_items(request, message, url, singleitem=None):
    if singleitem:
        messages.warning(request, '%s<form action="%s" method="post"><input type="hidden" value="%s" name="csrfmiddlewaretoken"><input type="submit" value="%s" /> <input type="button" value="%s"></form>' % (message, url, csrf(request)['csrf_token'], _("Yes"), _("No")))
    else:
        messages.warning(request, '%s<form action="%s" method="post"><input type="hidden" value="%s" name="csrfmiddlewaretoken"><input type="submit" value="%s" /> <input type="submit" name="all" value="%s" /> <input type="button" value="%s"></form>' % (message, url, csrf(request)['csrf_token'], _("Yes"), _("Yes, with all child items."), _("No")))

def del_confirm_form_for_items(request, object, name=None):
    if name is None:
        name = object
    if object.children:
        gen_confirm_form_for_items(request, _('Do you really want to delete <b>%s</b>?') % name, object.get_absolute_url('delete'), False)
    else:
        gen_confirm_form_for_items(request, _('Do you really want to delete <b>%s</b>?') % name, object.get_absolute_url('delete'), True)