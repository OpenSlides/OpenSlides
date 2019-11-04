from django.db import models

from openslides.utils.manager import BaseManager

from ..agenda.mixins import AgendaItemWithListOfSpeakersMixin
from ..mediafiles.models import Mediafile
from ..utils.models import RESTModelMixin
from .access_permissions import TopicAccessPermissions


class TopicManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all topics. In the background all
        attachments and the related agenda item are prefetched from the
        database.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .prefetch_related("attachments", "lists_of_speakers", "agenda_items")
        )


class Topic(RESTModelMixin, AgendaItemWithListOfSpeakersMixin, models.Model):
    """
    Model for slides with custom content. Used to be called custom slide.
    """

    access_permissions = TopicAccessPermissions()

    objects = TopicManager()

    title = models.CharField(max_length=256)
    text = models.TextField(blank=True)
    attachments = models.ManyToManyField(Mediafile, blank=True)

    class Meta:
        default_permissions = ()

    def __str__(self):
        return self.title

    def get_title_information(self):
        return {"title": self.title}
