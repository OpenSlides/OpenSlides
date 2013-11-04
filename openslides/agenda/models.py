# -*- coding: utf-8 -*-

from datetime import datetime

from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
from django.core.urlresolvers import reverse
from django.db import models
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop
from mptt.models import MPTTModel, TreeForeignKey

from openslides.config.api import config
from openslides.projector.api import (get_active_slide, reset_countdown,
                                      start_countdown, stop_countdown,
                                      update_projector, update_projector_overlay)
from openslides.projector.models import SlideMixin
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.person.models import PersonField


class Item(SlideMixin, MPTTModel):
    """
    An Agenda Item

    MPTT-model. See http://django-mptt.github.com/django-mptt/
    """
    slide_callback_name = 'agenda'

    AGENDA_ITEM = 1
    ORGANIZATIONAL_ITEM = 2

    ITEM_TYPE = (
        (AGENDA_ITEM, ugettext_lazy('Agenda item')),
        (ORGANIZATIONAL_ITEM, ugettext_lazy('Organizational item')))

    title = models.CharField(null=True, max_length=255, verbose_name=ugettext_lazy("Title"))
    """
    Title of the agenda item.
    """

    text = models.TextField(null=True, blank=True, verbose_name=ugettext_lazy("Text"))
    """
    The optional text of the agenda item.
    """

    comment = models.TextField(null=True, blank=True, verbose_name=ugettext_lazy("Comment"))
    """
    Optional comment to the agenda item. Will not be shoun to normal users.
    """

    closed = models.BooleanField(default=False, verbose_name=ugettext_lazy("Closed"))
    """
    Flag, if the item is finished.
    """

    type = models.IntegerField(max_length=1, choices=ITEM_TYPE,
                               default=AGENDA_ITEM, verbose_name=ugettext_lazy("Type"))
    """
    Type of the agenda item.

    See Item.ITEM_TYPE for more information.
    """

    duration = models.CharField(null=True, blank=True, max_length=5,
                                verbose_name=ugettext_lazy("Duration (hh:mm)"))
    """
    The intended duration for the topic.
    """

    parent = TreeForeignKey('self', null=True, blank=True,
                            related_name='children')
    """
    The parent item in the agenda tree.
    """

    weight = models.IntegerField(default=0, verbose_name=ugettext_lazy("Weight"))
    """
    Weight to sort the item in the agenda.
    """

    content_type = models.ForeignKey(ContentType, null=True, blank=True)
    """
    Field for generic relation to a related object. Type of the object.
    """

    object_id = models.PositiveIntegerField(null=True, blank=True)
    """
    Field for generic relation to a related object. Id of the object.
    """
    # TODO: rename it to object_pk

    content_object = generic.GenericForeignKey()
    """
    Field for generic relation to a related object. General field to the related object.
    """

    speaker_list_closed = models.BooleanField(
        default=False, verbose_name=ugettext_lazy("List of speakers is closed"))
    """
    True, if the list of speakers is closed.
    """

    class Meta:
        permissions = (
            ('can_see_agenda', ugettext_noop("Can see agenda")),
            ('can_manage_agenda', ugettext_noop("Can manage agenda")),
            ('can_see_orga_items', ugettext_noop("Can see orga items and time scheduling of agenda")))

    class MPTTMeta:
        order_insertion_by = ['weight']

    def save(self, *args, **kwargs):
        super(Item, self).save(*args, **kwargs)
        active_slide = get_active_slide()
        active_slide_pk = active_slide.get('pk', None)
        if (active_slide['callback'] == 'agenda' and
                unicode(self.parent_id) == unicode(active_slide_pk)):
            update_projector()

    def __unicode__(self):
        return self.get_title()

    def get_absolute_url(self, link='detail'):
        """
        Return the URL to this item.

        The link can be detail, update or delete.
        """
        if link == 'detail' or link == 'view':
            return reverse('item_view', args=[str(self.id)])
        if link == 'update' or link == 'edit':
            return reverse('item_edit', args=[str(self.id)])
        if link == 'delete':
            return reverse('item_delete', args=[str(self.id)])
        if link == 'projector_list_of_speakers':
            return '%s&type=list_of_speakers' % super(Item, self).get_absolute_url('projector')
        if link == 'projector_summary':
            return '%s&type=summary' % super(Item, self).get_absolute_url('projector')
        return super(Item, self).get_absolute_url(link)

    def get_title(self):
        """
        Return the title of this item.
        """
        if not self.content_object:
            return self.title
        try:
            return self.content_object.get_agenda_title()
        except AttributeError:
            raise NotImplementedError('You have to provide a get_agenda_title method on your related model.')

    def get_title_supplement(self):
        """
        Return a supplement for the title.
        """
        if not self.content_object:
            return ''
        try:
            return self.content_object.get_agenda_title_supplement()
        except AttributeError:
            raise NotImplementedError('You have to provide a get_agenda_title_supplement method on your related model.')

    def set_closed(self, closed=True):
        """
        Changes the closed-status of the item.
        """
        self.closed = closed
        self.save()

    @property
    def weight_form(self):
        """
        Return the WeightForm for this item.
        """
        from openslides.agenda.forms import ItemOrderForm
        try:
            parent = self.parent.id
        except AttributeError:
            parent = 0
        initial = {
            'weight': self.weight,
            'self': self.id,
            'parent': parent,
        }
        return ItemOrderForm(initial=initial, prefix="i%d" % self.id)

    def delete(self, with_children=False):
        """
        Delete the Item.
        """
        if not with_children:
            for child in self.get_children():
                child.move_to(self.parent)
                child.save()
        super(Item, self).delete()
        Item.objects.rebuild()

    def get_list_of_speakers(self, old_speakers_count=None, coming_speakers_count=None):
        """
        Returns the list of speakers as a list of dictionaries. Each
        dictionary contains a prefix, the speaker and its type. Types
        are old_speaker, actual_speaker and coming_speaker.
        """
        speaker_query = Speaker.objects.filter(item=self)  # TODO: Why not self.speaker_set?
        list_of_speakers = []

        # Parse old speakers
        old_speakers = speaker_query.exclude(begin_time=None).exclude(end_time=None).order_by('end_time')
        if old_speakers_count is None:
            old_speakers_count = old_speakers.count()
        last_old_speakers_count = max(0, old_speakers.count() - old_speakers_count)
        old_speakers = old_speakers[last_old_speakers_count:]
        for number, speaker in enumerate(old_speakers):
            prefix = old_speakers_count - number
            speaker_dict = {
                'prefix': '-%d' % prefix,
                'speaker': speaker,
                'type': 'old_speaker',
                'first_in_group': False,
                'last_in_group': False}
            if number == 0:
                speaker_dict['first_in_group'] = True
            if number == old_speakers_count - 1:
                speaker_dict['last_in_group'] = True
            list_of_speakers.append(speaker_dict)

        # Parse actual speaker
        try:
            actual_speaker = speaker_query.filter(end_time=None).exclude(begin_time=None).get()
        except Speaker.DoesNotExist:
            pass
        else:
            list_of_speakers.append({
                'prefix': '0',
                'speaker': actual_speaker,
                'type': 'actual_speaker',
                'first_in_group': True,
                'last_in_group': True})

        # Parse coming speakers
        coming_speakers = speaker_query.filter(begin_time=None).order_by('weight')
        if coming_speakers_count is None:
            coming_speakers_count = coming_speakers.count()
        coming_speakers = coming_speakers[:max(0, coming_speakers_count)]
        for number, speaker in enumerate(coming_speakers):
            speaker_dict = {
                'prefix': number + 1,
                'speaker': speaker,
                'type': 'coming_speaker',
                'first_in_group': False,
                'last_in_group': False}
            if number == 0:
                speaker_dict['first_in_group'] = True
            if number == coming_speakers_count - 1:
                speaker_dict['last_in_group'] = True
            list_of_speakers.append(speaker_dict)

        return list_of_speakers

    def get_next_speaker(self):
        """
        Returns the speaker object of the person who is next.
        """
        try:
            return self.speaker_set.filter(begin_time=None).order_by('weight')[0]
        except IndexError:
            # The list of speakers is empty.
            return None


class SpeakerManager(models.Manager):
    def add(self, person, item):
        if self.filter(person=person, item=item, begin_time=None).exists():
            raise OpenSlidesError(_(
                '%(person)s is already on the list of speakers of item %(id)s.')
                % {'person': person, 'id': item.id})
        if isinstance(person, AnonymousUser):
            raise OpenSlidesError(
                _('An anonymous user can not be on lists of speakers.'))
        weight = (self.filter(item=item).aggregate(
            models.Max('weight'))['weight__max'] or 0)
        return self.create(item=item, person=person, weight=weight + 1)


class Speaker(models.Model):
    """
    Model for the Speaker list.
    """

    objects = SpeakerManager()

    person = PersonField()
    """
    ForeinKey to the person who speaks.
    """

    item = models.ForeignKey(Item)
    """
    ForeinKey to the AgendaItem to which the person want to speak.
    """

    begin_time = models.DateTimeField(null=True)
    """
    Saves the time, when the speaker begins to speak. None, if he has not spoken yet.
    """

    end_time = models.DateTimeField(null=True)
    """
    Saves the time, when the speaker ends his speach. None, if he is not finished yet.
    """

    weight = models.IntegerField(null=True)
    """
    The sort order of the list of speakers. None, if he has already spoken.
    """

    class Meta:
        permissions = (
            ('can_be_speaker', ugettext_noop('Can put oneself on the list of speakers')),
        )

    def save(self, *args, **kwargs):
        super(Speaker, self).save(*args, **kwargs)
        self.check_and_update_projector()

    def delete(self, *args, **kwargs):
        super(Speaker, self).delete(*args, **kwargs)
        self.check_and_update_projector()

    def __unicode__(self):
        return unicode(self.person)

    def get_absolute_url(self, link='detail'):
        if link == 'detail' or link == 'view':
            return self.person.get_absolute_url('detail')
        if link == 'delete':
            return reverse('agenda_speaker_delete',
                           args=[self.item.pk, self.pk])

    def check_and_update_projector(self):
        """
        Checks, if the agenda item, or parts of it, is on the projector.
        If yes, it updates the projector.
        """
        active_slide = get_active_slide()
        active_slide_pk = active_slide.get('pk', None)
        slide_type = active_slide.get('type', None)
        if (active_slide['callback'] == 'agenda' and
                unicode(self.item_id) == unicode(active_slide_pk)):
            if slide_type == 'list_of_speakers':
                update_projector()
            elif slide_type is None:
                update_projector_overlay('agenda_speaker')

    def begin_speach(self):
        """
        Let the person speak.

        Set the weight to None and the time to now. If anyone is still
        speaking, end his speach.
        """
        try:
            actual_speaker = Speaker.objects.filter(item=self.item, end_time=None).exclude(begin_time=None).get()
        except Speaker.DoesNotExist:
            pass
        else:
            actual_speaker.end_speach()
        self.weight = None
        self.begin_time = datetime.now()
        self.save()
        # start countdown
        if config['agenda_couple_countdown_and_speakers']:
            reset_countdown()
            start_countdown()

    def end_speach(self):
        """
        The speach is finished. Set the time to now.
        """
        self.end_time = datetime.now()
        self.save()
        # stop countdown
        if config['agenda_couple_countdown_and_speakers']:
            stop_countdown()
