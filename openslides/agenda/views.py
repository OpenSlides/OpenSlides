#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the agenda app.

    :copyright: 2011, 2012 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from reportlab.platypus import Paragraph

from django.core.urlresolvers import reverse
from django.contrib import messages
from django.db import transaction
from django.db.models import Model
from django.utils.translation import ugettext as _, ugettext_lazy
from django.views.generic.detail import SingleObjectMixin

from openslides.config.models import config
from openslides.agenda.forms import ConfigForm
from openslides.utils.pdf import stylesheet
from openslides.utils.views import (
    TemplateView, RedirectView, UpdateView, CreateView, DeleteView, PDFView,
    DetailView, FormView)
from openslides.utils.template import Tab
from openslides.utils.utils import html_strong
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Widget, SLIDE
from .models import Item
from .forms import ItemOrderForm, ItemForm
from datetime import datetime, timedelta


class Overview(TemplateView):
    """
    Show all agenda items, and update there range via post.
    """
    permission_required = 'agenda.can_see_agenda'
    template_name = 'agenda/overview.html'



    def get_context_data(self, **kwargs):
        context = super(Overview, self).get_context_data(**kwargs)

        if self.request.user.has_perm('agenda.can_see_orga_items'):
            items = Item.objects.all()
        else:
            items = Item.objects.filter(type__exact = 'agd')

        duration = timedelta()
        for agenda_item in Item.objects.filter(closed=False):
            if agenda_item.duration is not None:
                duration += timedelta(hours=agenda_item.duration.hour, minutes=agenda_item.duration.minute)

        start =  config['agenda_start_event_time']
        if start is None:
            start = u'0:00:00'

        start = datetime.strptime(start, '%H:%M:%S')
        end =  start + duration
        duration = datetime.strptime(str(duration), '%H:%M:%S')

        context.update({
            'items': items,
            'active_sid': get_active_slide(only_sid=True),
            'duration': duration,
            'start': start,
            'end': end,
        })
        return context

    @transaction.commit_manually
    def post(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        if not request.user.has_perm('agenda.can_manage_agenda'):
            messages.error(
                request,
                _('You are not authorized to manage the agenda.'))
            return self.render_to_response(context)
        transaction.commit()
        for item in Item.objects.all():
            form = ItemOrderForm(request.POST, prefix="i%d" % item.id)
            if form.is_valid():
                try:
                    parent = Item.objects.get(id=form.cleaned_data['parent'])
                except Item.DoesNotExist:
                    parent = None
                item.weight = form.cleaned_data['weight']
                item.parent = parent
                Model.save(item)
            else:
                transaction.rollback()
                messages.error(
                    request, _('Errors when reordering of the agenda'))
                return self.render_to_response(context)
        Item.objects.rebuild()
        # TODO: assure, that it is a valid tree
        transaction.commit()
        return self.render_to_response(context)


class View(DetailView):
    """
    Show an agenda item.
    """
    permission_required = 'agenda.can_see_agenda'
    template_name = 'agenda/view.html'
    model = Item
    context_object_name = 'item'


class SetClosed(RedirectView, SingleObjectMixin):
    """
    Close or open an item.
    """
    permission_required = 'agenda.can_manage_agenda'
    allow_ajax = True
    url = 'item_overview'
    model = Item


    def get_ajax_context(self, **kwargs):
        context = super(SetClosed, self).get_ajax_context(**kwargs)
        closed = kwargs['closed']
        if closed:
            link = reverse('item_open', args=[self.object.id])
        else:
            link = reverse('item_close', args=[self.object.id])
        context.update({
            'closed': kwargs['closed'],
            'link': link,
        })
        return context

    def pre_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        closed = kwargs['closed']
        self.object.set_closed(closed)
        return super(SetClosed, self).pre_redirect(request, *args, **kwargs)


class ItemUpdate(UpdateView):
    """
    Update an existing item.
    """
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'agenda/edit.html'
    model = Item
    context_object_name = 'item'
    form_class = ItemForm
    success_url = 'item_overview'
    apply_url = 'item_edit'

    def get_success_url(self):
        messages.success(
            self.request, _("Item %s was successfully modified.")
            % html_strong(self.request.POST['title']))
        if 'apply' in self.request.POST:
            return ''
        return reverse(super(UpdateView, self).get_success_url())


class ItemCreate(CreateView):
    """
    Create a new item.
    """
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'agenda/edit.html'
    model = Item
    context_object_name = 'item'
    form_class = ItemForm
    success_url = 'item_overview'
    apply_url = 'item_edit'

    def get_success_url(self):
        messages.success(
            self.request, _("Item %s was successfully created.")
            % html_strong(self.request.POST['title']))
        if 'apply' in self.request.POST:
            return reverse(self.get_apply_url(), args=[self.object.id])
        return reverse(super(CreateView, self).get_success_url())


class ItemDelete(DeleteView):
    """
    Delete an item.
    """
    permission_required = 'agenda.can_manage_agenda'
    model = Item
    url = 'item_overview'

    def get_answer_options(self):
        if self.object.children.exists():
            return [('all', _("Yes, with all child items."))] + self.answer_options
        else:
            return self.answer_options

    def pre_post_redirect(self, request, *args, **kwargs):
        if self.get_answer() == 'all':
            self.object.delete(with_children=True)
            messages.success(
                request, _("Item %s and his children were successfully deleted.")
                % html_strong(self.object))
        elif self.get_answer() == 'yes':
            self.object.delete(with_children=False)
            messages.success(
                request, _("Item %s was successfully deleted.")
                % html_strong(self.object))


class AgendaPDF(PDFView):
    """
    Create a full agenda-PDF.
    """
    permission_required = 'agenda.can_see_agenda'
    filename = ugettext_lazy('Agenda')
    document_title = ugettext_lazy('Agenda')

    def append_to_pdf(self, story):
        for item in Item.objects.filter(type__exact = 'agd'):
            ancestors = item.get_ancestors()
            if ancestors:
                space = "&nbsp;" * 6 * ancestors.count()
                story.append(Paragraph(
                    "%s%s" % (space, item.get_title()),
                    stylesheet['Subitem']))
            else:
                story.append(Paragraph(item.get_title(), stylesheet['Item']))

class Config(FormView):
    """
    Config page for the agenda app.
    """
    permission_required = 'config.can_manage_config'
    form_class = ConfigForm
    template_name = 'agenda/config.html'

    def get_initial(self):
        return {
            'agenda_start_event_time': config['agenda_start_event_time'],
        }

    def form_valid(self, form):
        config['agenda_start_event_time'] = form.cleaned_data['agenda_start_event_time']
        messages.success(self.request, _('Agenda settings successfully saved.'))
        return super(Config, self).form_valid(form)

def register_tab(request):
    """
    register the agenda tab.
    """
    selected = request.path.startswith('/agenda/')
    return Tab(
        title=_('Agenda'),
        url=reverse('item_overview'),
        permission=(request.user.has_perm('agenda.can_see_agenda') or
                    request.user.has_perm('agenda.can_manage_agenda')),
        selected=selected)


def get_widgets(request):
    """
    return the agenda widget for the projector-tab.
    """
    return [
        Widget(
            name='agenda',
            display_name=_('Agenda'),
            template='agenda/widget.html',
            context={
                'agenda': SLIDE['agenda'],
                'items': Item.objects.all()},
            permission_required='projector.can_manage_projector')]
