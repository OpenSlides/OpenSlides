# -*- coding: utf-8 -*-
# TODO: Rename all views and template names

from datetime import datetime, timedelta

from django.contrib import messages
from django.core.urlresolvers import reverse
from django.db import transaction
from django.db.models import Model
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy
from reportlab.platypus import Paragraph

from openslides.config.api import config
from openslides.projector.api import get_active_slide, update_projector
from openslides.projector.projector import Widget
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.pdf import stylesheet
from openslides.utils.template import Tab
from openslides.utils.utils import html_strong
from openslides.utils.views import (CreateView, DeleteView, FormView, PDFView,
                                    RedirectView, SingleObjectMixin,
                                    TemplateView, UpdateView)

from .forms import AppendSpeakerForm, ItemForm, ItemOrderForm, RelatedItemForm
from .models import Item, Speaker


class Overview(TemplateView):
    """
    Show all agenda items, and update their range via post.
    """
    permission_required = 'agenda.can_see_agenda'
    template_name = 'agenda/overview.html'

    def get_context_data(self, **kwargs):
        context = super(Overview, self).get_context_data(**kwargs)

        if self.request.user.has_perm('agenda.can_see_orga_items'):
            items = Item.objects.all()
        else:
            items = Item.objects.filter(type__exact=Item.AGENDA_ITEM)

        # Save the items as a list (not a queryset). This is important,
        # because in other case, django-mtpp reloads the items in the
        # template. But we add some attributes (in this function), which are
        # not in the database and would be lost if the items were reloaded.
        # TODO: Try to remove this line in later versions of django-mptt
        items = list(items)

        start = config['agenda_start_event_date_time']
        if start is None or len(start) == 0:
            start = None
        else:
            start = datetime.strptime(start, '%d.%m.%Y %H:%M')

        duration = timedelta()

        for item in items:
            if item.duration is not None and len(item.duration) > 0:
                if ':' in item.duration:
                    duration_list = item.duration.split(':')
                    duration += timedelta(hours=int(duration_list[0]),
                                          minutes=int(duration_list[1]))
                else:
                    hours = int(item.duration) / 60
                    minutes = int(item.duration) - (60 * hours)
                    duration += timedelta(hours=hours,
                                          minutes=minutes)
                    if minutes < 10:
                        minutes = "%s%s" % (0, minutes)
                    item.duration = "%s:%s" % (hours, minutes)
                if not start is None:
                    item.tooltip = start + duration

        if start is None:
            end = None
        else:
            end = start + duration

        duration = u'%d:%02d' % (
            (duration.days * 24 + duration.seconds / 3600.0),
            (duration.seconds / 60.0 % 60))

        active_slide = get_active_slide()
        if active_slide['callback'] == 'agenda':
            agenda_is_active = active_slide.get('pk', 'agenda') == 'agenda'
            active_type = active_slide.get('type', 'text')
        else:
            agenda_is_active = None
            active_type = None

        context.update({
            'items': items,
            'agenda_is_active': agenda_is_active,
            'duration': duration,
            'start': start,
            'end': end,
            'active_type': active_type})
        return context

    @transaction.commit_manually
    def post(self, request, *args, **kwargs):
        if not request.user.has_perm('agenda.can_manage_agenda'):
            messages.error(
                request,
                _('You are not authorized to manage the agenda.'))
            context = self.get_context_data(**kwargs)
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
                break
        else:
            Item.objects.rebuild()
            # TODO: assure, that it is a valid tree
        context = self.get_context_data(**kwargs)
        transaction.commit()

        if get_active_slide()['callback'] == 'agenda':
            update_projector()
        context = self.get_context_data(**kwargs)
        transaction.commit()
        return self.render_to_response(context)


class AgendaItemView(SingleObjectMixin, FormView):
    """
    Show an agenda item.
    """
    # TODO: use 'SingleObjectTemplateResponseMixin' to choose the right template name
    template_name = 'agenda/view.html'
    model = Item
    context_object_name = 'item'
    form_class = AppendSpeakerForm

    def has_permission(self, request, *args, **kwargs):
        """
        Checks if the user has the required permission.
        """
        if self.get_object().type == Item.ORGANIZATIONAL_ITEM:
            permission = request.user.has_perm('agenda.can_see_orga_items')
        else:
            permission = request.user.has_perm('agenda.can_see_agenda')
        return permission

    def get_context_data(self, **kwargs):
        self.object = self.get_object()
        list_of_speakers = self.object.get_list_of_speakers()
        active_slide = get_active_slide()
        active_type = active_slide.get('type', None)
        kwargs.update({
            'object': self.object,
            'list_of_speakers': list_of_speakers,
            'is_on_the_list_of_speakers': Speaker.objects.filter(
                item=self.object, begin_time=None, person=self.request.user).exists(),
            'active_type': active_type,
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
        closed = self.kwargs['closed']
        if closed:
            link = reverse('item_open', args=[self.object.pk])
        else:
            link = reverse('item_close', args=[self.object.pk])
        return super(SetClosed, self).get_ajax_context(closed=closed, link=link)

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
    success_url_name = 'item_overview'
    url_name_args = []

    def get_form_class(self):
        if self.object.content_object:
            form = RelatedItemForm
        else:
            form = ItemForm
        return form


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
    url_name_args = []


class ItemDelete(DeleteView):
    """
    Delete an item.
    """
    permission_required = 'agenda.can_manage_agenda'
    model = Item
    question_url_name = 'item_overview'
    success_url_name = 'item_overview'
    url_name_args = []

    def get_answer_options(self):
        """
        Returns the possible answers to the delete view.

        'all' is a possible answer, when the item has children.
        """
        # Cache the result in the request, so when the children are deleted, the
        # result does not change
        try:
            options = self.item_delete_answer_options
        except AttributeError:
            if self.object.children.exists():
                options = [('all', _("Yes, with all child items."))] + self.answer_options
            else:
                options = self.answer_options
            self.item_delete_answer_options = options
        return options

    def on_clicked_yes(self):
        """
        Deletes the item but not its children.
        """
        self.object.delete(with_children=False)

    def on_clicked_all(self):
        """
        Deletes the item and its children.
        """
        self.object.delete(with_children=True)

    def get_final_message(self):
        """
        Prints the success message to the user.
        """
        # OpenSlidesError (invalid answer) should never be raised here because
        # this method should only be called if the answer is 'yes' or 'all'.
        if self.get_answer() == 'yes':
            message = _('Item %s was successfully deleted.') % html_strong(self.object)
        else:
            message = _('Item %s and its children were successfully deleted.') % html_strong(self.object)
        return message


class CreateRelatedAgendaItemView(SingleObjectMixin, RedirectView):
    """
    View to create and agenda item for a related object.

    This view is only for subclassing in views of related apps. You
    have to define 'model = ....'
    """
    permission_required = 'agenda.can_manage_agenda'
    url_name = 'item_overview'
    url_name_args = []

    def get(self, request, *args, **kwargs):
        """
        Set self.object to the relevant object.
        """
        self.object = self.get_object()
        return super(CreateRelatedAgendaItemView, self).get(request, *args, **kwargs)

    def pre_redirect(self, request, *args, **kwargs):
        """
        Create the agenda item.
        """
        self.item = Item.objects.create(content_object=self.object)


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
            messages.error(request, _('The list of speakers is closed.'))
        else:
            try:
                Speaker.objects.add(item=self.object, person=request.user)
            except OpenSlidesError, e:
                messages.error(request, e)
            else:
                messages.success(request, _('You were successfully added to the list of speakers.'))


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
            # Any person who is on the list of speakers can delete himself from the list.
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
    Mark the speaking person.
    """
    permission_required = 'agenda.can_manage_agenda'
    url_name = 'item_view'
    model = Item

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object()
        try:
            speaker = Speaker.objects.filter(
                person=kwargs['person_id'],
                item=self.object,
                begin_time=None).get()
        except Speaker.DoesNotExist:  # TODO: Check the MultipleObjectsReturned error here?
            messages.error(
                self.request,
                _('%(person)s is not on the list of %(item)s.')
                % {'person': kwargs['person_id'], 'item': self.object})
        else:
            speaker.begin_speach()

    def get_url_name_args(self):
        return [self.object.pk]


class SpeakerEndSpeachView(SingleObjectMixin, RedirectView):
    """
    The speach of the actual speaker is finished.
    """
    permission_required = 'agenda.can_manage_agenda'
    url_name = 'item_view'
    model = Item

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object()
        try:
            speaker = Speaker.objects.filter(
                item=self.object,
                end_time=None).exclude(begin_time=None).get()
        except Speaker.DoesNotExist:
            messages.error(
                self.request,
                _('There is no one speaking at the moment according to %(item)s.')
                % {'item': self.object})
        else:
            speaker.end_speach()

    def get_url_name_args(self):
        return [self.object.pk]


class SpeakerListCloseView(SingleObjectMixin, RedirectView):
    """
    View to close and reopen a list of speakers.
    """
    permission_required = 'agenda.can_manage_agenda'
    model = Item
    reopen = False
    url_name = 'item_view'

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object()
        self.object.speaker_list_closed = not self.reopen
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
            return None
        messages.error(request, _('Could not change order. Invalid data.'))

    def get_url_name_args(self):
        return [self.object.pk]


class CurrentListOfSpeakersView(RedirectView):
    """
    Redirect to the current list of speakers and set the request.user on it,
    begins speach of the next speaker or ends the speach of the current speaker.
    """
    set_speaker = False
    next_speaker = False
    end_speach = False

    def get_item(self):
        """
        Returns the current Item, or None, if the current Slide is not an Agenda Item.
        """
        active_slide = get_active_slide()
        if active_slide['callback'] == 'agenda':
            try:
                return Item.objects.get(pk=active_slide.get('pk', None))
            except Item.DoesNotExist:
                return None
        else:
            return None

    def get_redirect_url(self):
        """
        Returns the URL to the item_view if:

        * the current slide is an item,
        * the user has the permission to see the item,
        * the user who wants to be a speaker has this permission and
        * the list of speakers of the item is not closed,

        in other case, it returns the URL to the dashboard.

        This method also adds the request.user to the list of speakers if he
        has the right permissions and the list is not closed.

        This method also begins the speach of the next speaker if the flag
        next_speaker is given.

        This method also ends the speach of the current speaker if the flag
        end_speach is given.
        """
        item = self.get_item()
        request = self.request

        if item is None:
            messages.error(request, _(
                'There is no list of speakers for the current slide. '
                'Please choose the agenda item manually from the agenda.'))
            return reverse('dashboard')

        if self.set_speaker:
            if item.speaker_list_closed:
                messages.error(request, _('The list of speakers is closed.'))
                reverse_to_dashboard = True
            else:
                if self.request.user.has_perm('agenda.can_be_speaker'):
                    try:
                        Speaker.objects.add(self.request.user, item)
                    except OpenSlidesError, e:
                        messages.error(request, e)
                    else:
                        messages.success(request, _('You were successfully added to the list of speakers.'))
                    finally:
                        reverse_to_dashboard = False
                else:
                    messages.error(request, _('You can not put yourself on the list of speakers.'))
                    reverse_to_dashboard = True
        else:
            reverse_to_dashboard = False

        if self.next_speaker:
            next_speaker_object = item.get_next_speaker()
            if next_speaker_object:
                next_speaker_object.begin_speach()
                messages.success(request, _('%s is now speaking.') % next_speaker_object)
            else:
                messages.error(request, _('The list of speakers is empty.'))
            if not self.set_speaker:
                reverse_to_dashboard = True

        if self.end_speach:
            try:
                current_speaker = item.speaker_set.filter(end_time=None).exclude(begin_time=None).get()
            except Speaker.DoesNotExist:
                messages.error(request, _('There is no one speaking at the moment.'))
            else:
                current_speaker.end_speach()
                messages.success(request, _('%s is now finished.') % current_speaker)
            reverse_to_dashboard = True

        if item.type == Item.ORGANIZATIONAL_ITEM:
            if reverse_to_dashboard or not self.request.user.has_perm('agenda.can_see_orga_items'):
                return reverse('dashboard')
            else:
                return reverse('item_view', args=[item.pk])
        else:
            if reverse_to_dashboard or not self.request.user.has_perm('agenda.can_see_agenda'):
                return reverse('dashboard')
            else:
                return reverse('item_view', args=[item.pk])


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
    active_slide = get_active_slide()
    if active_slide['callback'] == 'agenda':
        agenda_is_active = active_slide.get('pk', 'agenda') == 'agenda'
        active_type = active_slide.get('type', 'text')
    else:
        agenda_is_active = None
        active_type = None

    return [
        Widget(
            request,
            name='agenda',
            display_name=_('Agenda'),
            template='agenda/widget.html',
            context={
                'agenda_is_active': agenda_is_active,
                'items': Item.objects.all(),
                'active_type': active_type},
            permission_required='projector.can_manage_projector',
            default_column=1,
            default_weight=20),

        Widget(
            request,
            name='append_to_list_of_speakers',
            display_name=_('List of speakers'),
            template='agenda/speaker_widget.html',
            permission_required='agenda.can_be_speaker',
            default_column=1,
            default_weight=30)]
