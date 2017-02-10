from django.contrib.contenttypes.fields import GenericRelation
from django.db import models

from ..agenda.models import Item
from ..mediafiles.models import Mediafile
from ..utils.models import RESTModelMixin
from .access_permissions import TopicAccessPermissions


class TopicManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all topics. In the background all
        attachments and the related agenda item are prefetched from the
        database.
        """
        return self.get_queryset().prefetch_related('attachments', 'agenda_items')


class Topic(RESTModelMixin, models.Model):
    """
    Model for slides with custom content. Used to be called custom slide.
    """
    access_permissions = TopicAccessPermissions()

    objects = TopicManager()

    title = models.CharField(max_length=256)
    text = models.TextField(blank=True)
    attachments = models.ManyToManyField(Mediafile, blank=True)

    # In theory there could be one then more agenda_item. But we support only
    # one. See the property agenda_item.
    agenda_items = GenericRelation(Item, related_name='topics')

    class Meta:
        default_permissions = ()

    def __str__(self):
        return self.title

    @property
    def agenda_item(self):
        """
        Returns the related agenda item.
        """
        # We support only one agenda item so just return the first element of
        # the queryset.
        return self.agenda_items.all()[0]

    @property
    def agenda_item_id(self):
        """
        Returns the id of the agenda item object related to this object.
        """
        return self.agenda_item.pk

    def get_agenda_title(self):
        return self.title

    def get_agenda_list_view_title(self):
        return self.title
