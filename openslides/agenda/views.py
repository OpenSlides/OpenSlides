#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the agenda app.

    :copyright: 2011, 2012 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
# TODO: Rename all views and template names

from reportlab.platypus import Paragraph
from datetime import datetime, timedelta

from django.core.urlresolvers import reverse
from django.contrib import messages
from django.db import transaction
from django.db.models import Model
from django.utils.translation import ugettext as _, ugettext_lazy
from django.views.generic.detail import SingleObjectMixin

from openslides.config.api import config
from openslides.utils.pdf import stylesheet
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.views import (
    TemplateView, RedirectView, UpdateView, CreateView, DeleteView, PDFView,
    DetailView, FormView, SingleObjectMixin)
from openslides.utils.template import Tab
from openslides.utils.utils import html_strong
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Widget, SLIDE
from .models import Item, Speaker
from .forms import ItemOrderForm, ItemForm, AppendSpeakerForm


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
            items = Item.objects.filter(type__exact=Item.AGENDA_ITEM)

        start = config['agenda_start_event_date_time']
        if start is None or len(start) == 0:
            start = None
        else:
            start = datetime.strptime(start, '%d.%m.%Y %H:%M')

        duration = timedelta()

        for item in items:
            if not item.closed and (item.duration is not None
                                    and len(item.duration) > 0):
                duration_list = item.duration.split(':')
                duration += timedelta(hours=int(duration_list[0]),
                                      minutes=int(duration_list[1]))
                if not start is None:
                    item.tooltip = start + duration

        if start is None:
            end = None
        else:
            end = start + duration

        duration = u'%d:%02d' % (
            (duration.days * 24 + duration.seconds / 3600.0),
            (duration.seconds / 60.0 % 60))

        context.update({
            'items': items,
            'active_sid': get_active_slide(only_sid=True),
            'duration': duration,
            'start': start,
            'end': end})
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


class AgendaItemView(SingleObjectMixin, FormView):
    """
    Show an agenda item.
    """
    # TODO: use 'SingleObjectTemplateResponseMixin' to choose the right template name
    permission_required = 'agenda.can_see_agenda'
    template_name = 'agenda/view.html'
    model = Item
    context_object_name = 'item'
    form_class = AppendSpeakerForm

    def get_context_data(self, **kwargs):
        self.object = self.get_object()
        speakers = Speaker.objects.filter(time=None, item=self.object.pk).order_by('weight')
        old_speakers = list(Speaker.objects.exclude(time=None).order_by('time'))
        kwargs.update({
            'object': self.object,
            'speakers': speakers,
            'old_speakers': old_speakers,
            'is_speaker': Speaker.objects.filter(
                time=None, person=self.request.user, item=self.object).exists(),
            'show_list': config['presentation_argument'] == 'show_list_of_speakers',
        })
        return super(AgendaItemView, self).get_context_data(**kwargs)

    def form_valid(self, form):
        Speaker.objects.add(person=form.cleaned_data['speaker'], item=self.get_object())
        return self.render_to_response(self.get_context_data(form=form))

    def get_form_kwargs(self):
        kwargs = super(AgendaItemView, self).get_form_kwargs()
        kwargs['item'] = self.get_object()
        return kwargs


class SetClosed(RedirectView, SingleObjectMixin):
    """
    Close or open an item.
    """
    permission_required = 'agenda.can_manage_agenda'
    allow_ajax = True
    url_name = 'item_overview'
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
            'link': link})
        return context

    def pre_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        closed = kwargs['closed']
        self.object.set_closed(closed)
        return super(SetClosed, self).pre_redirect(request, *args, **kwargs)

    def get_url_name_args(self):
        return []


class ItemUpdate(UpdateView):
    """
    Update an existing item.
    """
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'agenda/edit.html'
    model = Item
    context_object_name = 'item'
    form_class = ItemForm
    success_url_name = 'item_overview'


class ItemCreate(CreateView):
    """
    Create a new item.
    """
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'agenda/edit.html'
    model = Item
    context_object_name = 'item'
    form_class = ItemForm
    success_url_name = 'item_overview'


class ItemDelete(DeleteView):
    """
    Delete an item.
    """
    permission_required = 'agenda.can_manage_agenda'
    model = Item
    question_url_name = 'item_overview'
    success_url_name = 'item_overview'

    def get_answer_options(self):
        if self.object.children.exists():
            return [('all', _("Yes, with all child items."))] + self.answer_options
        else:
            return self.answer_options

    def pre_post_redirect(self, request, *args, **kwargs):
        if self.get_answer() == 'all':
            self.object.delete(with_children=True)
            messages.success(
                request,
                _("Item %s and his children were successfully deleted.")
                % html_strong(self.object))
        elif self.get_answer() == 'yes':
            self.object.delete(with_children=False)
            messages.success(
                request,
                _("Item %s was successfully deleted.")
                % html_strong(self.object))


class AgendaPDF(PDFView):
    """
    Create a full agenda-PDF.
    """
    permission_required = 'agenda.can_see_agenda'
    filename = ugettext_lazy('Agenda')
    document_title = ugettext_lazy('Agenda')

    def append_to_pdf(self, story):
        for item in Item.objects.filter(type__exact=Item.AGENDA_ITEM):
            ancestors = item.get_ancestors()
            if ancestors:
                space = "&nbsp;" * 6 * ancestors.count()
                story.append(Paragraph(
                    "%s%s" % (space, item.get_title()),
                    stylesheet['Subitem']))
            else:
                story.append(Paragraph(item.get_title(), stylesheet['Item']))


class SpeakerAppendView(SingleObjectMixin, RedirectView):
    """
    Set the request.user to the speaker list.
    """

    permission_required = 'agenda.can_be_speaker'
    url_name = 'item_view'
    model = Item

    def pre_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        if self.object.speaker_list_closed:
            messages.error(request, _('List of speakers is closed.'))
        else:
            try:
                Speaker.objects.add(item=self.object, person=request.user)
            except OpenSlidesError, e:
                messages.error(request, e)


class SpeakerDeleteView(DeleteView):
    """
    Delete the request.user or a specific user from the speaker list.
    """

    success_url_name = 'item_view'
    question_url_name = 'item_view'

    def has_permission(self, request, *args, **kwargs):
        """
        Check the permission to delete a speaker.
        """
        if 'speaker' in kwargs:
            return request.user.has_perm('agenda.can_manage_agenda')
        else:
            # Any person how is on the list of speakers can delete him self from the list
            return True

    def get(self, *args, **kwargs):
        try:
            return super(SpeakerDeleteView, self).get(*args, **kwargs)
        except Speaker.DoesNotExist:
            messages.error(self.request, _('You are not on the list of speakers.'))
            return super(RedirectView, self).get(*args, **kwargs)

    def get_object(self):
        """
        Returns the speaker object.

        If 'speaker' is in kwargs, this speaker object is returnd. Else, a speaker
        object with the request.user as speaker.
        """
        try:
            return Speaker.objects.get(pk=self.kwargs['speaker'])
        except KeyError:
            return Speaker.objects.filter(
                item=self.kwargs['pk'], person=self.request.user).exclude(weight=None).get()

    def get_url_name_args(self):
        return [self.kwargs['pk']]

    def get_question(self):
        if 'speaker' in self.kwargs:
            return super(SpeakerDeleteView, self).get_question()
        else:
            return _('Do you really want to remove yourself from the list of speakers?')


class SpeakerSpeakView(SingleObjectMixin, RedirectView):
    """
    Mark a speaker, that he can speak.
    """
    permission_required = 'agenda.can_manage_agenda'
    url_name = 'item_view'
    model = Item

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object()
        try:
            speaker = Speaker.objects.filter(
                person=kwargs['person_id'],
                item=self.object.pk).exclude(
                    weight=None).get()
        except Speaker.DoesNotExist:
            messages.error(self.request, _('Person %s is not on the list of item %s.'
                                           % (kwargs['person_id'], self.object)))
        else:
            speaker.speak()

    def get_url_name_args(self):
        return [self.object.pk]


class SpeakerListOpenView(SingleObjectMixin, RedirectView):
    """
    View to open and close a list of speakers.
    """
    permission_required = 'agenda.can_manage_agenda'
    model = Item
    open_list = False
    url_name = 'item_view'

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object()
        self.object.speaker_list_closed = not self.open_list
        self.object.save()

    def get_url_name_args(self):
        return [self.object.pk]


class SpeakerChangeOrderView(SingleObjectMixin, RedirectView):
    """
    Change the order of the speakers.

    Has to be called as post-request with the new order of the speaker ids.
    """
    permission_required = 'agenda.can_manage_agenda'
    model = Item
    url_name = 'item_view'

    def pre_redirect(self, args, **kwargs):
        self.object = self.get_object()

    @transaction.commit_manually
    def pre_post_redirect(self, request, *args, **kwargs):
        """
        Reorder the list of speaker.

        Take the string 'sort_order' from the post-data, and use this order.
        """
        self.object = self.get_object()
        transaction.commit()
        for (counter, speaker) in enumerate(self.request.POST['sort_order'].split(',')):
            try:
                speaker_pk = int(speaker.split('_')[1])
            except IndexError:
                transaction.rollback()
                break
            try:
                speaker = Speaker.objects.filter(item=self.object).get(pk=speaker_pk)
            except:
                transaction.rollback()
                break
            speaker.weight = counter + 1
            speaker.save()
        else:
            transaction.commit()

    def get_url_name_args(self):
        return [self.object.pk]


def register_tab(request):
    """
    Registers the agenda tab.
    """
    selected = request.path.startswith('/agenda/')
    return Tab(
        title=_('Agenda'),
        app='agenda',
        url=reverse('item_overview'),
        permission=(request.user.has_perm('agenda.can_see_agenda') or
                    request.user.has_perm('agenda.can_manage_agenda')),
        selected=selected)


def get_widgets(request):
    """
    Returns the agenda widget for the projector tab.
    """
    return [Widget(
        name='agenda',
        display_name=_('Agenda'),
        template='agenda/widget.html',
        context={
            'agenda': SLIDE['agenda'],
            'items': Item.objects.all()},
        permission_required='projector.can_manage_projector')]
