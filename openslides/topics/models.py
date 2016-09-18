from django.contrib.contenttypes.models import ContentType
from django.db import models

from ..agenda.models import Item
from ..mediafiles.models import Mediafile
from ..utils.models import RESTModelMixin
from .access_permissions import TopicAccessPermissions


class Topic(RESTModelMixin, models.Model):
    """
    Model for slides with custom content. Used to be called custom slide.
    """
    access_permissions = TopicAccessPermissions()

    title = models.CharField(max_length=256)
    text = models.TextField(blank=True)
    attachments = models.ManyToManyField(Mediafile, blank=True)

    class Meta:
        default_permissions = ()

    def __str__(self):
        return self.title

    @property
    def agenda_item(self):
        """
        Returns the related agenda item.
        """
        content_type = ContentType.objects.get_for_model(self)
        return Item.objects.get(object_id=self.pk, content_type=content_type)

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

    def get_search_index_string(self):
        """
        Returns a string that can be indexed for the search.
        """
        return " ".join((
            self.title,
            self.text))
