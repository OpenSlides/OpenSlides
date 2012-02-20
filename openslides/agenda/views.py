#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the agenda app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.utils.translation import ugettext as _
from django.core.context_processors import csrf

from utils.pdf import print_agenda
from utils.views import TemplateView, RedirectView, UpdateView, CreateView, DeleteView

from system import config

from projector.api import get_active_slide, set_active_slide

from agenda.models import Item
from agenda.api import is_summary
from agenda.forms import ItemOrderForm, ItemForm


class View(TemplateView):
    permission_required = 'agenda.can_see_projector'
    template_name = 'projector/AgendaText.html'

    def get_context_data(self, **kwargs):
        context = super(View, self).get_context_data(**kwargs)
        context.update({
            'item': Item.objects.get(pk=kwargs['item_id']),
            'ajax': 'off',
        })
        return context


class Overview(TemplateView):
    permission_required = 'agenda.can_see_agenda'
    template_name = 'agenda/overview.html'

    def get_context_data(self, **kwargs):
        context = super(TemplateView, self).get_context_data(**kwargs)
        context.update({
            'items': Item.objects.all(),
            'overview': get_active_slide(only_sid=True) == 'agenda_show',
            'summary': is_summary(),
            'countdown_visible': config['countdown_visible'],
            'countdown_time': config['agenda_countdown_time'],
        })
        return context

    def post(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        #todo: check for any erros in the forms befor saving the data
        for item in Item.objects.all():
            form = ItemOrderForm(request.POST, prefix="i%d" % item.id)
            if form.is_valid():
                try:
                    item.parent = Item.objects.get(
                                       id=form.cleaned_data['parent'])
                except Item.DoesNotExist:
                    item.parent = None
                item.weight = form.cleaned_data['weight']
                item.save()
        return self.render_to_response(context)


class SetActive(RedirectView):
    """
    Set an Item as the active one.
    """
    url = 'item_overview'
    allow_ajax = True
    permission_required = 'agenda.can_manage_agenda'

    def get_ajax_context(self, **kwargs):
        context = super(SetActive, self).get_ajax_context(**kwargs)
        context.update({
            'active': kwargs['item_id'],
            'summary': is_summary(),
        })
        return context

    def pre_redirect(self, request, *args, **kwargs):
        item_id = kwargs['item_id']
        summary = kwargs['summary']
        if item_id == "0":
            set_active_slide("agenda_show")
        else:
            try:
                item = Item.objects.get(pk=item_id)
                item.set_active(summary)
            except Item.DoesNotExist:
                messages.error(request, _('Item ID %d does not exist.') % int(item_id))
        config["bigger"] = 100
        config["up"] = 0
        return super(SetActive, self).pre_redirect(request, *args, **kwargs)


class SetClosed(RedirectView):
    """
    Close or open an Item.
    """
    permission_required = 'agenda.can_manage_agenda'
    allow_ajax = True
    url = 'item_overview'

    def get_ajax_context(self, **kwargs):
        context = super(SetClosed, self).get_ajax_context(**kwargs)
        closed = kwargs['closed']
        if closed:
            link = reverse('item_open', args=[self.item.id])
        else:
            link = reverse('item_close', args=[self.item.id])
        context.update({
            'closed': kwargs['closed'],
            'link': link,
        })
        return context

    def pre_redirect(self, request, *args, **kwargs):
        item_id = kwargs['item_id']
        closed = kwargs['closed']
        try:
            item = Item.objects.get(pk=item_id)
            item.set_closed(closed)
        except Item.DoesNotExist:
            messages.error(request, _('Item ID %d does not exist.') % int(item_id))
        self.item = item
        return super(SetClosed, self).pre_redirect(request, *args, **kwargs)


class ItemUpdate(UpdateView):
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'agenda/edit.html'
    model = Item
    context_object_name = 'item'
    form_class = ItemForm
    success_url = 'item_overview'


class ItemCreate(CreateView):
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'agenda/edit.html'
    model = Item
    context_object_name = 'item'
    form_class = ItemForm
    success_url = 'item_overview'


class ItemDelete(DeleteView):
    """
    Delete an Item.
    """
    permission_required = 'agenda.can_manage_agenda'
    model = Item
    url = 'item_overview'

    def pre_post_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()

        if 'all' in request.POST:
            self.object.delete()
            messages.success(request, _("Item <b>%s</b> and his children were successfully deleted.") % self.object)
        else:
            for child in self.object.children:
                child.parent = self.object.parent
                child.save()
            self.object.delete()
            messages.success(request, _("Item <b>%s</b> was successfully deleted.") % self.object)

    def gen_confirm_form(self, request, message, url, singleitem=None):
        if singleitem:
            messages.warning(request, '%s<form action="%s" method="post"><input type="hidden" value="%s" name="csrfmiddlewaretoken"><input type="submit" value="%s" /> <input type="button" value="%s"></form>' % (message, url, csrf(request)['csrf_token'], _("Yes"), _("No")))
        else:
            messages.warning(request, '%s<form action="%s" method="post"><input type="hidden" value="%s" name="csrfmiddlewaretoken"><input type="submit" value="%s" /> <input type="submit" name="all" value="%s" /> <input type="button" value="%s"></form>' % (message, url, csrf(request)['csrf_token'], _("Yes"), _("Yes, with all child items."), _("No")))

    def confirm_form(self, request, object, name=None):
        if name is None:
            name = object
        if object.children:
            self.gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % name, object.get_absolute_url('delete'), False)
        else:
            self.gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % name, object.get_absolute_url('delete'), True)
