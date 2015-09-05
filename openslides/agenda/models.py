from collections import defaultdict
from datetime import datetime

from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.core.config import config
from openslides.core.models import Tag
from openslides.core.projector import Countdown
from openslides.users.models import User
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.models import RESTModelMixin
from openslides.utils.utils import to_roman


class ItemManager(models.Manager):
    def get_tree(self, only_agenda_items=False, include_content=False):
        """
        Generator that yields dictonaries. Each dictonary has two keys, id
        and children, where id is the id of one agenda item and children is a
        generator that yields dictonaries like the one discribed.

        If only_agenda_items is True, the tree hides ORGANIZATIONAL_ITEMs.

        If include_content is True, the yielded dictonaries have no key 'id'
        but a key 'item' with the entire object.
        """
        item_queryset = self.order_by('weight')
        if only_agenda_items:
            item_queryset = item_queryset.filter(type__exact=Item.AGENDA_ITEM)

        # Index the items to get the children for each item
        item_children = defaultdict(list)
        for item in item_queryset:
            if item.parent:
                item_children[item.parent_id].append(item)

        def get_children(items):
            """
            Generator that yields the descibed diconaries.
            """
            for item in items:
                if include_content:
                    yield dict(item=item, children=get_children(item_children[item.pk]))
                else:
                    yield dict(id=item.pk, children=get_children(item_children[item.pk]))

        yield from get_children(filter(lambda item: item.parent is None, item_queryset))

    def set_tree(self, tree):
        """
        Sets the agenda tree.

        The tree has to be a nested object. For example:
        [{"id": 1}, {"id": 2, "children": [{"id": 3}]}]
        """
        def walk_items(tree, parent=None):
            """
            Generator that returns each item in the tree as tuple.

            This tuples have tree values. The item id, the item parent and the
            weight of the item.
            """
            for weight, element in enumerate(tree):
                yield (element['id'], parent, weight)
                yield from walk_items(element.get('children', []), element['id'])

        touched_items = set()
        for item_pk, parent_pk, weight in walk_items(tree):
            # Check that the item is only once in the tree to prevent invalid trees
            if item_pk in touched_items:
                raise ValueError("Item %d is more then once in the tree" % item_pk)
            touched_items.add(item_pk)

            Item.objects.filter(pk=item_pk).update(
                parent_id=parent_pk,
                weight=weight)


class Item(RESTModelMixin, models.Model):
    """
    An Agenda Item
    """
    objects = ItemManager()
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

    type = models.IntegerField(choices=ITEM_TYPE, default=AGENDA_ITEM, verbose_name=ugettext_lazy("Type"))
    """
    Type of the agenda item.

    See Item.ITEM_TYPE for more information.
    """

    duration = models.CharField(null=True, blank=True, max_length=5)
    """
    The intended duration for the topic.
    """

    parent = models.ForeignKey('self', null=True, blank=True, related_name='children')
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

    content_object = GenericForeignKey()
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
            ('can_see', ugettext_noop("Can see agenda")),
            ('can_manage', ugettext_noop("Can manage agenda")),
            ('can_see_orga_items', ugettext_noop("Can see orga items and time scheduling of agenda")))

    def __str__(self):
        return self.get_title()

    def clean(self):
        """
        Ensures that the children of orga items are only orga items.
        """
        if (self.type == self.AGENDA_ITEM and
                self.parent is not None and
                self.parent.type == self.ORGANIZATIONAL_ITEM):
            raise ValidationError(_('Agenda items can not be child elements of an organizational item.'))
        if (self.type == self.ORGANIZATIONAL_ITEM and
                self.children.filter(type=self.AGENDA_ITEM).exists()):
            raise ValidationError(_('Organizational items can not have agenda items as child elements.'))
        return super().clean()

    def delete(self, with_children=False):
        """
        Delete the Item.

        If with_children is True, all children of the item will be deleted as
        well. If with_children is False, all children will be children of the
        parent of the item.
        """
        if not with_children:
            for child in self.children.all():
                child.parent = self.parent
                child.save()
        super().delete()

    def get_title(self):
        """
        Return the title of this item.
        """
        if not self.content_object:
            agenda_title = self.title or ""
        else:
            try:
                agenda_title = self.content_object.get_agenda_title()
            except AttributeError:
                raise NotImplementedError('You have to provide a get_agenda_title '
                                          'method on your related model.')
        return '%s %s' % (self.item_no, agenda_title) if self.item_no else agenda_title

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

    def get_list_of_speakers(self, old_speakers_count=None, coming_speakers_count=None):
        """
        Returns the list of speakers as a list of dictionaries. Each
        dictionary contains a prefix, the speaker and its type. Types
        are old_speaker, actual_speaker and coming_speaker.
        """
        list_of_speakers = []

        # Parse old speakers
        old_speakers = self.speakers.exclude(begin_time=None).exclude(end_time=None).order_by('end_time')
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
            actual_speaker = self.speakers.filter(end_time=None).exclude(begin_time=None).get()
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
        coming_speakers = self.speakers.filter(begin_time=None).order_by('weight')
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
        Returns the speaker object of the user who is next.
        """
        try:
            return self.speakers.filter(begin_time=None).order_by('weight')[0]
        except IndexError:
            # The list of speakers is empty.
            return None

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
            if self.parent is None:
                sibling_no = self.sibling_no()
                if config['agenda_numeral_system'] == 'arabic':
                    return str(sibling_no)
                else:  # config['agenda_numeral_system'] == 'roman'
                    return to_roman(sibling_no)
            else:
                return '%s.%s' % (self.parent.calc_item_no(), self.sibling_no())
        else:
            return ''

    def sibling_no(self):
        """
        Counts how many AGENDA_ITEMS with the same parent (siblings) have a
        smaller weight then this item.

        Returns this number + 1 or 0 when self is not an AGENDA_ITEM.
        """
        return Item.objects.filter(
            parent=self.parent,
            type=self.AGENDA_ITEM,
            weight__lte=self.weight).count()


class SpeakerManager(models.Manager):
    def add(self, user, item):
        if self.filter(user=user, item=item, begin_time=None).exists():
            raise OpenSlidesError(_(
                '%(user)s is already on the list of speakers of item %(id)s.')
                % {'user': user, 'id': item.id})
        if isinstance(user, AnonymousUser):
            raise OpenSlidesError(
                _('An anonymous user can not be on lists of speakers.'))
        weight = (self.filter(item=item).aggregate(
            models.Max('weight'))['weight__max'] or 0)
        return self.create(item=item, user=user, weight=weight + 1)


class Speaker(RESTModelMixin, models.Model):
    """
    Model for the Speaker list.
    """

    objects = SpeakerManager()

    user = models.ForeignKey(User)
    """
    ForeinKey to the user who speaks.
    """

    item = models.ForeignKey(Item, related_name='speakers')
    """
    ForeinKey to the AgendaItem to which the user want to speak.
    """

    begin_time = models.DateTimeField(null=True)
    """
    Saves the time, when the speaker begins to speak. None, if he has not spoken yet.
    """

    end_time = models.DateTimeField(null=True)
    """
    Saves the time, when the speaker ends his speech. None, if he is not finished yet.
    """

    weight = models.IntegerField(null=True)
    """
    The sort order of the list of speakers. None, if he has already spoken.
    """

    class Meta:
        permissions = (
            ('can_be_speaker', ugettext_noop('Can put oneself on the list of speakers')),
        )

    def __str__(self):
        return str(self.user)

    def begin_speech(self):
        """
        Let the user speak.

        Set the weight to None and the time to now. If anyone is still
        speaking, end his speech.
        """
        try:
            actual_speaker = Speaker.objects.filter(item=self.item, end_time=None).exclude(begin_time=None).get()
        except Speaker.DoesNotExist:
            pass
        else:
            actual_speaker.end_speech()
        self.weight = None
        self.begin_time = datetime.now()
        self.save()
        if config['agenda_couple_countdown_and_speakers']:
            Countdown.control(action='reset')
            Countdown.control(action='start')

    def end_speech(self):
        """
        The speech is finished. Set the time to now.
        """
        self.end_time = datetime.now()
        self.save()
        if config['agenda_couple_countdown_and_speakers']:
            Countdown.control(action='stop')

    def get_root_rest_element(self):
        """
        Returns the item to this instance which is the root REST element.
        """
        return self.item
