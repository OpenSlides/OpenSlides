# -*- coding: utf-8 -*-

from datetime import datetime

from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.urlresolvers import reverse
from django.db import models
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop
from mptt.models import MPTTModel, TreeForeignKey

from openslides.config.api import config
from openslides.core.models import Tag
from openslides.projector.api import (get_active_slide, reset_countdown,
                                      start_countdown, stop_countdown,
                                      update_projector, update_projector_overlay)
from openslides.projector.models import SlideMixin
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.models import AbsoluteUrlMixin
from openslides.utils.person.models import PersonField
from openslides.utils.utils import to_roman


class Item(SlideMixin, AbsoluteUrlMixin, MPTTModel):
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

    item_number = models.CharField(blank=True, max_length=255, verbose_name=ugettext_lazy("Number"))
    """
    Number of agenda item.
    """

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

    duration = models.CharField(null=True, blank=True, max_length=5)
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

    tags = models.ManyToManyField(Tag, blank=True)
    """
    Tags to categorise agenda items.
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
        if self.parent and self.parent.is_active_slide():
            update_projector()

    def clean(self):
        """
        Ensures that the children of orga items are only orga items.
        """
        if self.type == self.AGENDA_ITEM and self.parent is not None and self.parent.type == self.ORGANIZATIONAL_ITEM:
            raise ValidationError(_('Agenda items can not be child elements of an organizational item.'))
        if self.type == self.ORGANIZATIONAL_ITEM and self.get_descendants().filter(type=self.AGENDA_ITEM).exists():
            raise ValidationError(_('Organizational items can not have agenda items as child elements.'))
        return super(Item, self).clean()

    def __unicode__(self):
        return self.get_title()

    def get_absolute_url(self, link='detail'):
        """
        Return the URL to this item.

        The link can be detail, update or delete.
        """
        if link == 'detail':
            url = reverse('item_view', args=[str(self.id)])
        elif link == 'update':
            url = reverse('item_edit', args=[str(self.id)])
        elif link == 'delete':
            url = reverse('item_delete', args=[str(self.id)])
        elif link == 'projector_list_of_speakers':
            url = '%s&type=list_of_speakers' % super(Item, self).get_absolute_url('projector')
        elif link == 'projector_summary':
            url = '%s&type=summary' % super(Item, self).get_absolute_url('projector')
        elif (link in ('projector', 'projector_preview') and
                self.content_object and isinstance(self.content_object, SlideMixin)):
            url = self.content_object.get_absolute_url(link)
        else:
            url = super(Item, self).get_absolute_url(link)
        return url

    def get_title(self):
        """
        Return the title of this item.
        """
        item_no = self.item_no
        if not self.content_object:
            return '%s %s' % (item_no, self.title) if item_no else self.title
        try:
            agenda_title = self.content_object.get_agenda_title()
            return '%s %s' % (item_no, agenda_title) if item_no else agenda_title
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

    def is_active_slide(self):
        """
        Returns True if the slide is active. If the slide is a related item,
        Returns True if the related object is active.
        """
        if super(Item, self).is_active_slide():
            value = True
        elif self.content_object and isinstance(self.content_object, SlideMixin):
            value = self.content_object.is_active_slide()
        else:
            value = False
        return value

    @property
    def item_no(self):
        item_no = None
        if self.item_number:
            if config['agenda_number_prefix']:
                item_no = '%s %s' % (config['agenda_number_prefix'], self.item_number)
            else:
                item_no = str(self.item_number)
        return item_no

    def calc_item_no(self):
        """
        Returns the number of this agenda item.
        """
        if self.type == self.AGENDA_ITEM:
            if self.is_root_node():
                if config['agenda_numeral_system'] == 'arabic':
                    return str(self._calc_sibling_no())
                else:  # config['agenda_numeral_system'] == 'roman'
                    return to_roman(self._calc_sibling_no())
            else:
                return '%s.%s' % (self.parent.calc_item_no(), self._calc_sibling_no())
        else:
            return ''

    def _calc_sibling_no(self):
        """
        Counts all siblings on the same level which are AGENDA_ITEMs.
        """
        sibling_no = 0
        prev_sibling = self.get_previous_sibling()
        while prev_sibling is not None:
            if prev_sibling.type == self.AGENDA_ITEM:
                sibling_no += 1
            prev_sibling = prev_sibling.get_previous_sibling()
        return sibling_no + 1


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


class Speaker(AbsoluteUrlMixin, models.Model):
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
        if link == 'detail':
            url = self.person.get_absolute_url('detail')
        elif link == 'delete':
            url = reverse('agenda_speaker_delete',
                          args=[self.item.pk, self.pk])
        else:
            url = super(Speaker, self).get_absolute_url(link)
        return url

    def check_and_update_projector(self):
        """
        Checks, if the agenda item, or parts of it, is on the projector.
        If yes, it updates the projector.
        """
        if self.item.is_active_slide():
            if get_active_slide().get('type', None) == 'list_of_speakers':
                update_projector()
            else:
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
            if self.item.is_active_slide():
                # TODO: only update the overlay if the overlay is active and
                #       slide type is None.
                update_projector_overlay('projector_countdown')

    def end_speach(self):
        """
        The speach is finished. Set the time to now.
        """
        self.end_time = datetime.now()
        self.save()
        # stop countdown
        if config['agenda_couple_countdown_and_speakers']:
            stop_countdown()
            if self.item.is_active_slide():
                # TODO: only update the overlay if the overlay is active and
                #       slide type is None.
                update_projector_overlay('projector_countdown')
