from collections import defaultdict
from typing import Dict, List, Set

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models, transaction
from django.utils import timezone

from openslides.core.config import config
from openslides.core.models import Countdown, Tag
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.manager import BaseManager
from openslides.utils.models import (
    CASCADE_AND_AUTOUPDATE,
    SET_NULL_AND_AUTOUPDATE,
    RESTModelMixin,
)
from openslides.utils.postgres import restart_id_sequence
from openslides.utils.utils import to_roman

from .access_permissions import ItemAccessPermissions, ListOfSpeakersAccessPermissions


class ItemManager(BaseManager):
    """
    Customized model manager with special methods for agenda tree and
    numbering.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all items. In the background all
        related items (topics, motions, assignments) are prefetched from the database.
        """
        # TODO: Fix the django bug: we cannot include "content_object__agenda_items" here,
        # because this is some kind of cyclic lookup. The _prefetched_objects_cache of every
        # content object will hold wrong values for the agenda item.
        # See issue #4738
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .prefetch_related("content_object", "parent", "tags")
        )

    def get_only_non_public_items(self):
        """
        Generator, which yields only internal and hidden items, that means only items
        which type is INTERNAL_ITEM or HIDDEN_ITEM or which are children of hidden items.
        """
        # Do not execute non-hidden items because this would create a lot of db queries
        root_items, item_children = self.get_root_and_children(only_item_type=None)

        def yield_items(items, parent_is_not_public=False):
            """
            Generator that yields a list of items and their children.
            """
            for item in items:
                if parent_is_not_public or item.type in (
                    item.INTERNAL_ITEM,
                    item.HIDDEN_ITEM,
                ):
                    item_is_not_public = True
                    yield item
                else:
                    item_is_not_public = False
                yield from yield_items(
                    item_children[item.pk], parent_is_not_public=item_is_not_public
                )

        yield from yield_items(root_items)

    def get_root_and_children(self, only_item_type=None):
        """
        Returns a list with all root items and a dictonary where the key is an
        item pk and the value is a list with all children of the item.

        If only_item_type is given, the tree hides items with other types and
        all of their children.
        """
        queryset = self.order_by("weight")
        item_children: Dict[int, List[Item]] = defaultdict(list)
        root_items = []
        for item in queryset:
            if only_item_type is not None and item.type != only_item_type:
                continue
            if item.parent_id is not None:
                item_children[item.parent_id].append(item)
            else:
                root_items.append(item)
        return root_items, item_children

    def get_tree(self, only_item_type=None, include_content=False):
        """
        Generator that yields dictonaries. Each dictonary has two keys, id
        and children, where id is the id of one agenda item and children is a
        generator that yields dictonaries like the one discribed.

        If only_item_type is given, the tree hides items with other types and
        all of their children.

        If include_content is True, the yielded dictonaries have no key 'id'
        but a key 'item' with the entire object.
        """
        root_items, item_children = self.get_root_and_children(
            only_item_type=only_item_type
        )

        def get_children(items):
            """
            Generator that yields the descibed diconaries.
            """
            for item in items:
                if include_content:
                    yield dict(item=item, children=get_children(item_children[item.pk]))
                else:
                    yield dict(
                        id=item.pk, children=get_children(item_children[item.pk])
                    )

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
                yield (element["id"], parent, weight)
                yield from walk_items(element.get("children", []), element["id"])

        touched_items: Set[int] = set()
        db_items = dict((item.pk, item) for item in Item.objects.all())
        for item_id, parent_id, weight in walk_items(tree):
            # Check that the item is only once in the tree to prevent invalid trees
            if item_id in touched_items:
                raise ValueError(f"Item {item_id} is more then once in the tree.")
            touched_items.add(item_id)

            try:
                db_item = db_items[item_id]
            except KeyError:
                raise ValueError(f"Item {item_id} is not in the database.")

            # Check if the item has changed and update it
            # Note: Do not use Item.objects.update, so that the items are sent
            #       to the clients via autoupdate
            if db_item.parent_id != parent_id or db_item.weight != weight:
                db_item.parent_id = parent_id
                db_item.weight = weight
                db_item.save()

    @transaction.atomic
    def number_all(self, numeral_system="arabic"):
        """
        Auto numbering of the agenda according to the numeral_system. Manually
        added item numbers will be overwritten.
        """

        def walk_tree(tree, number=None):
            for index, tree_element in enumerate(tree):
                # Calculate number of visable agenda items.
                if numeral_system == "roman" and number is None:
                    item_number = to_roman(index + 1)
                else:
                    item_number = str(index + 1)
                    if number is not None:
                        item_number = ".".join((number, item_number))
                # Add prefix.
                if config["agenda_number_prefix"]:
                    item_number_tmp = f"{config['agenda_number_prefix']} {item_number}"
                else:
                    item_number_tmp = item_number
                # Save the new value and go down the tree.
                tree_element["item"].item_number = item_number_tmp
                tree_element["item"].save()
                walk_tree(tree_element["children"], item_number)

        # Start numbering visable agenda items.
        walk_tree(self.get_tree(only_item_type=Item.AGENDA_ITEM, include_content=True))

        # Reset number of hidden items.
        for item in self.get_only_non_public_items():
            item.item_number = ""
            item.save()


class Item(RESTModelMixin, models.Model):
    """
    An Agenda Item
    """

    access_permissions = ItemAccessPermissions()
    objects = ItemManager()
    can_see_permission = "agenda.can_see"

    AGENDA_ITEM = 1
    INTERNAL_ITEM = 2
    HIDDEN_ITEM = 3

    ITEM_TYPE = (
        (AGENDA_ITEM, "Agenda item"),
        (INTERNAL_ITEM, "Internal item"),
        (HIDDEN_ITEM, "Hidden item"),
    )

    item_number = models.CharField(blank=True, max_length=255)
    """
    Number of agenda item.
    """

    comment = models.TextField(null=True, blank=True)
    """
    Optional comment to the agenda item. Will not be shown to normal users.
    """

    closed = models.BooleanField(default=False)
    """
    Flag, if the item is finished.
    """

    type = models.IntegerField(choices=ITEM_TYPE, default=HIDDEN_ITEM)
    """
    Type of the agenda item.

    See Item.ITEM_TYPE for more information.
    """

    duration = models.IntegerField(null=True, blank=True)
    """
    The intended duration for the topic.
    """

    parent = models.ForeignKey(
        "self",
        on_delete=SET_NULL_AND_AUTOUPDATE,
        null=True,
        blank=True,
        related_name="children",
    )
    """
    The parent item in the agenda tree.
    """

    weight = models.IntegerField(default=10000)
    """
    Weight to sort the item in the agenda.
    """

    content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, blank=True
    )
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

    tags = models.ManyToManyField(Tag, blank=True)
    """
    Tags for the agenda item.
    """

    class Meta:
        default_permissions = ()
        permissions = (
            ("can_see", "Can see agenda"),
            ("can_manage", "Can manage agenda"),
            (
                "can_see_internal_items",
                "Can see internal items and time scheduling of agenda",
            ),
        )
        unique_together = ("content_type", "object_id")
        ordering = ["weight"]

    @property
    def title_information(self):
        """
        Return get_agenda_title_information() from the content_object.
        """
        try:
            return self.content_object.get_agenda_title_information()
        except AttributeError:
            raise NotImplementedError(
                "You have to provide a get_agenda_title_information "
                "method on your related model."
            )

    def is_internal(self):
        """
        Returns True if the type of this object itself is a internal item or any
        of its ancestors has such a type.

        Attention! This executes one query for each ancestor of the item.
        """
        return self.type == self.INTERNAL_ITEM or (
            self.parent is not None and self.parent.is_internal()
        )

    def is_hidden(self):
        """
        Returns True if the type of this object itself is a hidden item or any
        of its ancestors has such a type.

        Attention! This executes one query for each ancestor of the item.
        """
        return self.type == self.HIDDEN_ITEM or (
            self.parent is not None and self.parent.is_hidden()
        )

    @property
    def level(self):
        """
        Returns the level in agenda (=tree of all items). Level 0 means this
        item is a root item in the agenda. Level 1 indicates that the parent is
        a root item, level 2 that the parent's parent is a root item and so on.

        Attention! This executes one query for each ancestor of the item.
        """
        if self.parent is None:
            return 0
        else:
            return self.parent.level + 1


class ListOfSpeakersManager(BaseManager):
    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all items. In the background all
        speakers and related items (topics, motions, assignments) are
        prefetched from the database.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .prefetch_related("speakers", "content_object")
        )


class ListOfSpeakers(RESTModelMixin, models.Model):

    access_permissions = ListOfSpeakersAccessPermissions()
    objects = ListOfSpeakersManager()
    can_see_permission = "agenda.can_see_list_of_speakers"

    content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, blank=True
    )
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

    closed = models.BooleanField(default=False)
    """
    True, if the list of speakers is closed.
    """

    class Meta:
        default_permissions = ()
        permissions = (
            ("can_see_list_of_speakers", "Can see list of speakers"),
            ("can_manage_list_of_speakers", "Can manage list of speakers"),
        )
        unique_together = ("content_type", "object_id")

    @property
    def title_information(self):
        """
        Return get_list_of_speakers_title_information() from the content_object.
        """
        try:
            return self.content_object.get_list_of_speakers_title_information()
        except AttributeError:
            raise NotImplementedError(
                "You have to provide a get_list_of_speakers_title_information "
                "method on your related model."
            )

    def get_next_speaker(self):
        """
        Returns the speaker object of the speaker who is next.
        """
        try:
            return self.speakers.filter(begin_time=None).order_by("weight")[0]
        except IndexError:
            # The list of speakers is empty.
            return None


class SpeakerManager(models.Manager):
    """
    Manager for Speaker model. Provides a customized add method.
    """

    def add(self, user, list_of_speakers, skip_autoupdate=False, point_of_order=False):
        """
        Customized manager method to prevent anonymous users to be on the
        list of speakers and that someone is twice on one list (off coming
        speakers). Cares also initial sorting of the coming speakers.
        """
        if isinstance(user, AnonymousUser):
            raise OpenSlidesError("An anonymous user can not be on lists of speakers.")

        if point_of_order and not config["agenda_enable_point_of_order_speakers"]:
            raise OpenSlidesError("Point of order speakers are not enabled.")

        if self.filter(
            user=user,
            list_of_speakers=list_of_speakers,
            begin_time=None,
            point_of_order=point_of_order,
        ).exists():
            raise OpenSlidesError(f"{user} is already on the list of speakers.")
        if config["agenda_present_speakers_only"] and not user.is_present:
            raise OpenSlidesError("Only present users can be on the lists of speakers.")

        if point_of_order:
            weight = (
                self.filter(list_of_speakers=list_of_speakers).aggregate(
                    models.Min("weight")
                )["weight__min"]
                or 0
            ) - 1
        else:
            weight = (
                self.filter(list_of_speakers=list_of_speakers).aggregate(
                    models.Max("weight")
                )["weight__max"]
                or 0
            ) + 1

        speaker = self.model(
            list_of_speakers=list_of_speakers,
            user=user,
            weight=weight,
            point_of_order=point_of_order,
        )
        speaker.save(
            force_insert=True,
            skip_autoupdate=skip_autoupdate,
            no_delete_on_restriction=True,
        )
        return speaker


class Speaker(RESTModelMixin, models.Model):
    """
    Model for the Speaker list.
    """

    objects = SpeakerManager()

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE_AND_AUTOUPDATE)
    """
    ForeinKey to the user who speaks.
    """

    list_of_speakers = models.ForeignKey(
        ListOfSpeakers, on_delete=models.CASCADE, related_name="speakers"
    )
    """
    ForeinKey to the list of speakers to which the user want to speak.
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

    marked = models.BooleanField(default=False)
    """
    Marks a speaker.
    """

    point_of_order = models.BooleanField(default=False)
    """
    Identifies the speaker as someone with a point of order
    """

    class Meta:
        default_permissions = ()
        permissions = (("can_be_speaker", "Can put oneself on the list of speakers"),)

    def __str__(self):
        return str(self.user)

    def begin_speech(self):
        """
        Let the user speak.

        Set the weight to None and the time to now. If anyone is still
        speaking, end his speech.
        """
        try:
            current_speaker = (
                Speaker.objects.filter(
                    list_of_speakers=self.list_of_speakers, end_time=None
                )
                .exclude(begin_time=None)
                .get()
            )
        except Speaker.DoesNotExist:
            pass
        else:
            # Do not send an autoupdate for the countdown and the list_of_speakers. This is done
            # by saving the list_of_speakers and countdown later.
            current_speaker.end_speech(skip_autoupdate=True)
        self.weight = None
        self.begin_time = timezone.now()
        self.save()  # Here, the list_of_speakers is saved and causes an autoupdate.
        if config["agenda_couple_countdown_and_speakers"]:
            countdown, created = Countdown.objects.get_or_create(
                pk=1,
                defaults={
                    "default_time": config["projector_default_countdown"],
                    "title": "Default countdown",
                    "countdown_time": config["projector_default_countdown"],
                },
            )
            if created:
                restart_id_sequence("core_countdown")
            else:
                countdown.control(action="reset", skip_autoupdate=True)
            countdown.control(action="start", skip_autoupdate=True)

            inform_changed_data(
                countdown
            )  # Here, the autoupdate for the countdown is triggered.

    def end_speech(self, skip_autoupdate=False):
        """
        The speech is finished. Set the time to now.
        """
        self.end_time = timezone.now()
        self.save(skip_autoupdate=skip_autoupdate)
        if config["agenda_couple_countdown_and_speakers"]:
            try:
                countdown = Countdown.objects.get(pk=1)
            except Countdown.DoesNotExist:
                pass  # Do not create a new countdown on stop action
            else:
                countdown.control(action="reset", skip_autoupdate=skip_autoupdate)

    def get_root_rest_element(self):
        """
        Returns the list_of_speakers to this instance which is the root REST element.
        """
        return self.list_of_speakers
