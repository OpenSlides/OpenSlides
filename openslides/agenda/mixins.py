from typing import Any, Dict

from django.contrib.contenttypes.fields import GenericRelation
from django.db import models

from .models import Item, ListOfSpeakers


# See https://github.com/python/mypy/issues/3855
Unsafe: Any = object


class AgendaItemMixin(models.Model):
    """
    A mixin for every model that should have an agenda item associated.
    """

    # In theory there could be one then more agenda_item. But we support only one.
    agenda_items = GenericRelation(Item)

    class Meta(Unsafe):
        abstract = True

    agenda_item_skip_autoupdate = False

    def __init__(self, *args, **kwargs):
        self.agenda_item_update_information: Dict[str, Any] = {}
        """
        Container for runtime information for agenda app (on create or update of this instance).
        Can be an attribute of an item, e.g. "type", "parent_id", "comment", "duration", "weight",
        or "create", which determinates, if the items should be created. If not given, the
        config value is used.

        Important: Do not just write this into the class definition, becuase the object would become
        shared within all instances inherited from this class!
        """

        super().__init__(*args, **kwargs)

    @property
    def agenda_item(self):
        """
        Returns the related agenda item, if it exists.
        """
        try:
            return self.agenda_items.all()[0]
        except IndexError:
            return None

    @property
    def agenda_item_id(self):
        """
        Returns the id of the agenda item object related to this object.
        """
        if self.agenda_item is None:
            return None
        return self.agenda_item.pk

    def get_agenda_title_information(self):
        raise NotImplementedError(
            "An agenda content object has to provide title information"
        )


class ListOfSpeakersMixin(models.Model):
    """
    A mixin for every model that should have a list of speakers associated.
    """

    # In theory there could be one then more list of speakers. But we support only one.
    lists_of_speakers = GenericRelation(ListOfSpeakers)

    class Meta(Unsafe):
        abstract = True

    list_of_speakers_skip_autoupdate = False

    @property
    def list_of_speakers(self):
        """
        Returns the related list of speakers object.
        """
        # We support only one list of speakers so just return the first element of
        # the queryset.
        return self.lists_of_speakers.all()[0]

    @property
    def list_of_speakers_id(self):
        """
        Returns the id of the list of speakers object related to this object.
        """
        return self.list_of_speakers.pk

    def get_list_of_speakers_title_information(self):
        raise NotImplementedError(
            "An agenda content object has to provide title information"
        )


class AgendaItemWithListOfSpeakersMixin(AgendaItemMixin, ListOfSpeakersMixin):
    """
    A combined mixin for agenda items and list of speakers.
    """

    class Meta(Unsafe):
        abstract = True

    def set_skip_autoupdate_agenda_item_and_list_of_speakers(
        self, skip_autoupdate=True
    ):
        self.agenda_item_skip_autoupdate = skip_autoupdate
        self.list_of_speakers_skip_autoupdate = skip_autoupdate

    def get_title_information(self):
        raise NotImplementedError(
            "An agenda content object has to provide title information"
        )

    def get_agenda_title_information(self):
        # TODO: See issue #4738
        return self.get_title_information()

    def get_list_of_speakers_title_information(self):
        # TODO: See issue #4738
        return self.get_title_information()
