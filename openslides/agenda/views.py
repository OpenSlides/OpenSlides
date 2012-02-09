#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the agenda app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from datetime import datetime

from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.utils.translation import ugettext as _

from projector.api import get_active_slide
from agenda.models import Item
from agenda.api import is_summary, children_list, \
                                  del_confirm_form_for_items
from agenda.forms import ItemOrderForm, ItemFormText
from application.models import Application
from assignment.models import Assignment
from poll.models import Poll
from system.api import config_set, config_get
from utils.template import render_block_to_string
from utils.utils import template, permission_required, \
                                   del_confirm_form, ajax_request
from utils.pdf import print_agenda
from poll.models import Poll, Option

def view(request, item_id):
    """
    Shows the Slide.
    """
    item = Item.objects.get(id=item_id)
    return render_to_response('projector/AgendaText.html',
                             {
                                 'item': item,
                                 'ajax': 'off',
                             },
                             context_instance=RequestContext(request))


@permission_required('agenda.can_see_agenda')
@template('agenda/overview.html')
def overview(request):
    """
    Shows an overview of all items.
    """
    if request.method == 'POST':
        for item in Item.objects.all():
            form = ItemOrderForm(request.POST, prefix="i%d" % item.id)
            if form.is_valid():
                try:
                    item.parent = Item.objects.get( \
                                       id=form.cleaned_data['parent'])
                except Item.DoesNotExist:
                    item.parent = None
                item.weight = form.cleaned_data['weight']
                item.save()

    items = children_list(Item.objects.filter(parent=None).order_by('weight'))
    if get_active_slide(only_sid=True) == 'agenda_show':
        overview = True
    else:
        overview = False
    return {
        'items': items,
        'overview': overview,
        'summary': is_summary(),
        'countdown_visible': config_get('countdown_visible'),
        'countdown_time': config_get('agenda_countdown_time'),
        }


@permission_required('agenda.can_manage_agenda')
def set_active(request, item_id, summary=False):
    """
    Set an Item as the active one.
    """
    if item_id == "0":
        config_set("presentation", "agenda_show")
    else:
        try:
            item = Item.objects.get(id=item_id)
            item.set_active(summary)
        except Item.DoesNotExist:
            messages.error(request, _('Item ID %d does not exist.') % int(item_id))
    config_set("bigger", 100)
    config_set("up", 0)
    if request.is_ajax():
        return ajax_request({'active': item_id})

    return redirect(reverse('item_overview'))


@permission_required('agenda.can_manage_agenda')
def set_closed(request, item_id, closed=True):
    """
    Close or open an Item.
    """
    try:
        item = Item.objects.get(id=item_id)
        item.set_closed(closed)
    except Item.DoesNotExist:
        messages.error(request, _('Item ID %d does not exist.') % int(item_id))

    if request.is_ajax():
        if closed:
            link = reverse('item_open', args=[item.id])
        else:
            link = reverse('item_close', args=[item.id])

        return ajax_request({'closed': closed,
                             'link': link})
    return redirect(reverse('item_overview'))


@permission_required('agenda.can_manage_agenda')
@template('agenda/edit.html')
def edit(request, item_id=None):
    """
    Show a form to edit an existing Item, or create a new one.
    """
    if item_id is not None:
        try:
            item = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            messages.error(request, _('Item ID %d does not exist.') % int(item_id))
            return redirect(reverse('item_overview'))
    else:
        item = None

    if request.method == 'POST':
        form = ItemFormText(request.POST, instance=item)

        if form.is_valid():
            item = form.save()
            if item_id is None:
                messages.success(request, _('New item was successfully created.'))
            else:
                messages.success(request, _('Item was successfully modified.'))
            if not 'apply' in request.POST:
                return redirect(reverse('item_overview'))
            if item_id is None:
                return redirect(reverse('item_edit', args=[item.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form = ItemFormText(instance=item)
    return { 'form': form,
             'item': item }


@permission_required('agenda.can_manage_agenda')
def delete(request, item_id):
    """
    Delete an Item.
    """
    item = Item.objects.get(id=item_id).cast()
    if request.method == 'POST':
        if 'all' in request.POST:
            item.delete()
            messages.success(request, _("Item <b>%s</b> and his children were successfully deleted.") % item)
        else:
            for child in item.children:
                child.parent = item.parent
                child.save()
            item.delete()
            messages.success(request, _("Item <b>%s</b> was successfully deleted.") % item)
    else:
        del_confirm_form_for_items(request, item)
    return redirect(reverse('item_overview'))
