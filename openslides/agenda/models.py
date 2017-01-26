from collections import defaultdict

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models, transaction
from django.utils import timezone
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from openslides.core.config import config
from openslides.core.models import Countdown
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.models import RESTModelMixin
from openslides.utils.utils import to_roman

from .access_permissions import ItemAccessPermissions


class ItemManager(models.Manager):
    """
    Customized model manager with special methods for agenda tree and
    numbering.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all items. In the background all
        speakers and related items (topics, motions, assignments) are
        prefetched from the database.
        """
        return self.get_queryset().prefetch_related('speakers', 'content_object')

    def get_only_agenda_items(self):
        """
        Generator, which yields only agenda items. Skips hidden items.
        """
        # Do not execute item.is_hidden() because this would create a lot of db queries
        root_items, item_children = self.get_root_and_children(only_agenda_items=True)

        def yield_items(items):
            """
            Generator that yields a list of items and their children.
            """
            for item in items:
                yield item
                yield from yield_items(item_children[item.pk])

        yield from yield_items(root_items)

    def get_only_hidden_items(self):
        """
        Generator, which yields only hidden items, that means only items
        which type is HIDDEN_ITEM or which are children of hidden items.
        """
        # Do not execute item.is_hidden() because this would create a lot of db queries
        root_items, item_children = self.get_root_and_children(only_agenda_items=False)

        def yield_items(items, parent_is_hidden=False):
            """
            Generator that yields a list of items and their children.
            """
            for item in items:
                if parent_is_hidden or item.type == item.HIDDEN_ITEM:
                    item_is_hidden = True
                    yield item
                else:
                    item_is_hidden = False
                yield from yield_items(item_children[item.pk], parent_is_hidden=item_is_hidden)

        yield from yield_items(root_items)

    def get_root_and_children(self, only_agenda_items=False):
        """
        Returns a list with all root items and a dictonary where the key is an
        item pk and the value is a list with all children of the item.

        If only_agenda_items is True, the tree hides items with type
        HIDDEN_ITEM and all of their children.
        """
        queryset = self.order_by('weight')
        item_children = defaultdict(list)
        root_items = []
        for item in queryset:
            if only_agenda_items and item.type == item.HIDDEN_ITEM:
                continue
            if item.parent_id is not None:
                item_children[item.parent_id].append(item)
            else:
                root_items.append(item)
        return root_items, item_children

    def get_tree(self, only_agenda_items=False, include_content=False):
        """
        Generator that yields dictonaries. Each dictonary has two keys, id
        and children, where id is the id of one agenda item and children is a
        generator that yields dictonaries like the one discribed.

        If only_agenda_items is True, the tree hides items with type
        HIDDEN_ITEM and all of their children.

        If include_content is True, the yielded dictonaries have no key 'id'
        but a key 'item' with the entire object.
        """
        root_items, item_children = self.get_root_and_children(only_agenda_items=only_agenda_items)

        def get_children(items):
            """
            Generator that yields the descibed diconaries.
            """
            for item in items:
                if include_content:
                    yield dict(item=item, children=get_children(item_children[item.pk]))
                else:
                    yield dict(id=item.pk, children=get_children(item_children[item.pk]))

        yield from get_children(root_items)

    @transaction.atomic
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
        db_items = dict((item.pk, item) for item in Item.objects.all())
        for item_id, parent_id, weight in walk_items(tree):
            # Check that the item is only once in the tree to prevent invalid trees
            if item_id in touched_items:
                raise ValueError("Item {} is more then once in the tree.".format(item_id))
            touched_items.add(item_id)

            try:
                db_item = db_items[item_id]
            except KeyError:
                raise ValueError("Item {} is not in the database.".format(item_id))

            # Check if the item has changed and update it
            # Note: Do not use Item.objects.update, so that the items are sent
            #       to the clients via autoupdate
            if db_item.parent_id != parent_id or db_item.weight != weight:
                db_item.parent_id = parent_id
                db_item.weight = weight
                db_item.save()

    @transaction.atomic
    def number_all(self, numeral_system='arabic'):
        """
        Auto numbering of the agenda according to the numeral_system. Manually
        added item numbers will be overwritten.
        """
        def walk_tree(tree, number=None):
            for index, tree_element in enumerate(tree):
                # Calculate number of visable agenda items.
                if numeral_system == 'roman' and number is None:
                    item_number = to_roman(index + 1)
                else:
                    item_number = str(index + 1)
                    if number is not None:
                        item_number = '.'.join((number, item_number))
                # Add prefix.
                if config['agenda_number_prefix']:
                    item_number_tmp = "%s %s" % (config['agenda_number_prefix'], item_number)
                else:
                    item_number_tmp = item_number
                # Save the new value and go down the tree.
                tree_element['item'].item_number = item_number_tmp
                tree_element['item'].save()
                walk_tree(tree_element['children'], item_number)

        # Start numbering visable agenda items.
        walk_tree(self.get_tree(only_agenda_items=True, include_content=True))

        # Reset number of hidden items.
        for item in self.get_only_hidden_items():
            item.item_number = ''
            item.save()


class Item(RESTModelMixin, models.Model):
    """
    An Agenda Item
    """
    access_permissions = ItemAccessPermissions()
    objects = ItemManager()

    AGENDA_ITEM = 1
    HIDDEN_ITEM = 2

    ITEM_TYPE = (
        (AGENDA_ITEM, ugettext_lazy('Agenda item')),
        (HIDDEN_ITEM, ugettext_lazy('Hidden item')))

    item_number = models.CharField(blank=True, max_length=255)
    """
    Number of agenda item.
    """

    comment = models.TextField(null=True, blank=True)
    """
    Optional comment to the agenda item. Will not be shoun to normal users.
    """

    closed = models.BooleanField(default=False)
    """
    Flag, if the item is finished.
    """

    type = models.IntegerField(
        choices=ITEM_TYPE,
        default=HIDDEN_ITEM)
    """
    Type of the agenda item.

    See Item.ITEM_TYPE for more information.
    """

    duration = models.IntegerField(null=True, blank=True)
    """
    The intended duration for the topic.
    """

    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children')
    """
    The parent item in the agenda tree.
    """

    weight = models.IntegerField(default=10000)
    """
    Weight to sort the item in the agenda.
    """

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True)
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
        default=False)
    """
    True, if the list of speakers is closed.
    """

    class Meta:
        default_permissions = ()
        permissions = (
            ('can_see', 'Can see agenda'),
            ('can_manage', 'Can manage agenda'),
            ('can_see_hidden_items', 'Can see hidden items and time scheduling of agenda'))
        unique_together = ('content_type', 'object_id')

    def __str__(self):
        return self.title

    @property
    def title(self):
        """
        Return get_agenda_title() from the content_object.
        """
        try:
            return self.content_object.get_agenda_title()
        except AttributeError:
            raise NotImplementedError('You have to provide a get_agenda_title '
                                      'method on your related model.')

    @property
    def list_view_title(self):
        """
        Return get_agenda_list_view_title() from the content_object.
        """
        try:
            return self.content_object.get_agenda_list_view_title()
        except AttributeError:
            raise NotImplementedError('You have to provide a get_agenda_list_view_title '
                                      'method on your related model.')

    def is_hidden(self):
        """
        Returns True if the type of this object itself is a hidden item or any
        of its ancestors has such a type.

        Attention! This executes one query for each ancestor of the item.
        """
        return (self.type == self.HIDDEN_ITEM or
                (self.parent is not None and self.parent.is_hidden()))

    def get_next_speaker(self):
        """
        Returns the speaker object of the speaker who is next.
        """
        try:
            return self.speakers.filter(begin_time=None).order_by('weight')[0]
        except IndexError:
            # The list of speakers is empty.
            return None


class SpeakerManager(models.Manager):
    """
    Manager for Speaker model. Provides a customized add method.
    """
    def add(self, user, item):
        """
        Customized manager method to prevent anonymous users to be on the
        list of speakers and that someone is twice on one list (off coming
        speakers). Cares also initial sorting of the coming speakers.
        """
        if self.filter(user=user, item=item, begin_time=None).exists():
            raise OpenSlidesError(
                _('{user} is already on the list of speakers.').format(user=user))
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

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE)
    """
    ForeinKey to the user who speaks.
    """

    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='speakers')
    """
    ForeinKey to the agenda item to which the user want to speak.
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
        default_permissions = ()
        permissions = (
            ('can_be_speaker', 'Can put oneself on the list of speakers'),
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
            current_speaker = (Speaker.objects.filter(item=self.item, end_time=None)
                                              .exclude(begin_time=None).get())
        except Speaker.DoesNotExist:
            pass
        else:
            current_speaker.end_speech()
        self.weight = None
        self.begin_time = timezone.now()
        self.save()
        if config['agenda_couple_countdown_and_speakers']:
            countdown, created = Countdown.objects.get_or_create(pk=1, defaults={
                'default_time': config['projector_default_countdown'],
                'countdown_time': config['projector_default_countdown']})
            if not created:
                countdown.control(action='reset')
            countdown.control(action='start')

    def end_speech(self):
        """
        The speech is finished. Set the time to now.
        """
        self.end_time = timezone.now()
        self.save()
        if config['agenda_couple_countdown_and_speakers']:
            try:
                countdown = Countdown.objects.get(pk=1)
            except Countdown.DoesNotExist:
                pass  # Do not create a new countdown on stop action
            else:
                countdown.control(action='stop')

    def get_root_rest_element(self):
        """
        Returns the item to this instance which is the root REST element.
        """
        return self.item
